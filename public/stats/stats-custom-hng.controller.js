angular.module('stats', [])
// TODO : handle multiple series insertion and not only the former [original,average] couple --> we'd make boxplot in the future !
// TODO : make a controller for delete benchmark
    .directive('hcOperationChart', function () {
        return {
            restrict: 'E',
            template: '<div></div>',
            scope: {
                series: '=',
                operation: '@',
                updatefunc: '=',
                resizefunc: '=',
                initfunc: '='
            },
            link: function (scope, element) {
                var updateInterval;

                element.on('$destroy', function () {
                    clearInterval(updateInterval)
                });

                Highcharts.StockChart(element[0], {
                    chart: {
                        zoomType: 'x',
                        height: 650,
                        events: {
                            load: function () {
                                // set up the updating of the chart each second
                                var chart = this;
                                scope.initfunc(chart, scope.operation);
                                updateInterval = setInterval(function () {
                                    var extremesObject = chart.xAxis[0].getExtremes();
                                    scope.updatefunc(chart, scope.operation, Math.round(extremesObject.dataMax));
                                }, 5000);
                            }
                        }
                    },
                    tooltip: {
                        formatter: function () {
                            var s = 'Measure #<b>' + this.x + '</b>';

                            this.points.forEach(function (point) {
                                s += '<br/><span style="color:'
                                    + point.series.color + '">\u25CF</span> '
                                    + point.series.name + ': <b>' + point.y + '</b>';
                            });
                            return s;

                        }
                    },
                    exporting: {
                        csv: {
                            dateFormat: '%Y-%m-%dT%H:%M:%S.%L'
                        }
                    },
                    rangeSelector: {
                        enabled: true,
                        allButtonsEnabled: true,
                        buttons: [
                            // Note: xAxis is in nanoseconds that's explain the bunch of zeros
                            {
                                type: 'millisecond',
                                count: 1,
                                text: '1op'
                            }, {
                                type: 'millisecond',
                                count: 10,
                                text: '10op'
                            }, {
                                type: 'millisecond',
                                count: 10000,
                                text: '10000op'
                            }, {
                                type: 'millisecond',
                                count: 50000,
                                text: '50000op'
                            }, {
                                type: 'all',
                                text: 'All'
                            }],
                        buttonTheme: {
                            width: 50
                        },
                        selected: 5
                    },
                    navigator: {
                        enabled: true,
                        //adaptToUpdatedData: false,
                        series: {
                            includeInCSVExport: false,
                            id: 'nav'
                        },
                        xAxis: {
                            labels: {
                                formatter: function () {
                                    return this.value;
                                }
                            }
                        }
                    },
                    xAxis: {
                        labels: {
                            formatter: function () {
                                return this.value;
                            }
                        },
                        /*events: {
                         afterSetExtremes: function (e) {
                         console.log(e);
                         scope.resizefunc(this.chart, scope.operation, Math.round(e.min), Math.round(e.max));
                         }
                         }*/
                    },
                    series: [
                        {
                            id: scope.operation + '_latency',
                            name: scope.operation + ' latency',
                            data: []
                        },
                        {
                            id: scope.operation + '_latency_average',
                            name: 'Average ' + scope.operation + ' latency',
                            data: []
                        }
                    ],
                    title: {
                        text: scope.operation + ' latency'
                    }
                });
            }
        };
    })

    // inject the Benchmark service factory into our controller
    .controller('StatController', ['$scope', '$rootScope', '$http', 'Benchmarks', '$routeParams', '$mdSidenav', '$mdDialog', '$mdToast', '$location', '$q', function ($scope, $rootScope, $http, Benchmarks, $routeParams, $mdSidenav, $mdDialog, $mdToast, $location, $q) {

        $scope.benchmarkName = $routeParams.benchmarkName;
        $rootScope.pageTitle = 'Benchmark results';
        $scope.currentNavItem = 'nav-' + $scope.benchmarkName;
        $scope.MAX_POINTS = 20000; // Number maximal of points got from MongoDB
        // (depends on your browser/computer performance) and has a undetermined upper limit with NodeJS
        $scope.updateSemaphore = {}; // Map of semaphores for synchronizing updates
        $scope.operationArray = ["INSERT", "READ", "UPDATE", "SCAN", "CLEANUP"];
        $scope.operationArray.forEach(function (operationType) {
            $scope.updateSemaphore[operationType] = true;
        });
        $scope.benchmarkNames = getBenchmarkList();

        /**
         * Free update semaphore of a specific operationType chart
         * @param operationType the operationType string
         */
        function freeSemaphore(operationType) {
            $scope.updateSemaphore[operationType] = false;
        }

        /**
         * Convert stored raw values from YCSB to Highchart formatting
         *
         * NOTE : this function could be overwritten to handle every kind of dataset like candlestick for example
         *
         * @param rawValues YCSB raw DB values
         * @returns {*} Highchart formatted data
         */
        function convertToSerie(rawValues) {
            // FIXME: possible million iterations
            return rawValues.map(function (measureObj) {
                return [measureObj.num, measureObj.latency]
            });
        }

        /**
         * Update an average value with a O(1) complexity algorithm
         * @param average the former average
         * @param size the size of the serie
         * @param newValue the new value added to the serie (that's why we need a new average)
         * @returns {number} the new average
         */
        function updateAverage(average, size, newValue) {
            return (size * average + newValue) / (size + 1);
        }

        /**
         * Create an average serie data array from a value and an original serie
         * @param serieData the original serie data array of which we want an average serie
         * @param value the average
         * @returns {{name: string, data: *}} the average Highchart serie
         */
        function createAverageData(serieData, value) {
            // FIXME: possible million iterations
            return serieData.map(function (point) {
                return [point[0], value];
            })
        }

        /**
         * Return the serie average with an O(n) complexity algorithm
         * @param serieData the serie data
         * @returns {number} the average of the serie
         */
        function getAverage(serieData) {
            // FIXME: possible million iterations
            var total = serieData.reduce(function (previous, current) {
                return previous + current[1];
            }, 0);
            return total / serieData.length;
        }

        function getAllDataPoints(chart, id) {
            // FIXME: possible million iterations
            var points = [];
            var xData = chart.get(id).xData;
            var yData = chart.get(id).yData;
            for (var i = 0; i < xData.length; i++) {
                points.push([xData[i], yData[i]]);
            }
            return points;
        }

        function updateSeries(chart, operationType, newPointsData) {
            console.log('[' + operationType + '] Updating series');

            var average;
            var originalSerieLength = chart.get(operationType + '_latency').xData.length;
            average = chart.get(operationType + '_latency_average').yData[0];
            newPointsData.forEach(function (point) {
                average = updateAverage(average, originalSerieLength, point[1]);
            });

            var oldPoints = getAllDataPoints(chart, operationType + '_latency');
            var completeData = oldPoints.concat(newPointsData);
            chart.get(operationType + '_latency').setData(completeData);
            chart.get(operationType + '_latency_average').setData(createAverageData(completeData, average));

            //chart.redraw(); // TODO : test s'il est vraiment nécessaire

            freeSemaphore(operationType)
        }

        /*function updateNavigator(chart, pointsData) {
         var oldNavPoints = getAllDataPoints(chart, 'nav');
         var completeNavData = oldNavPoints.concat(pointsData);
         chart.get('nav').setData(completeNavData);
         chart.xAxis[0].setExtremes();
         }*/

        $scope.updateRoutine = function (chart, operationType, lastInserted) {
            if (!$scope.updateSemaphore[operationType]) {
                console.log('[' + operationType + '] Updating chart');
                $scope.updateSemaphore[operationType] = true;

                Benchmarks.getSize($scope.benchmarkName, operationType).success(function (data) {
                    var datasetSize = data["results"];
                    // FIXME: may return a different quality than the one displayed
                    var packetSize = Math.ceil(datasetSize / $scope.MAX_POINTS);
                    Benchmarks
                        .getByNameByOperationTypeByQuality($scope.benchmarkName, operationType, lastInserted, "MAX", $scope.MAX_POINTS,
                            packetSize)
                        .success(function (data) {
                            var newPoints = data["results"];

                            if (newPoints.length > 0) {
                                var newPointsData = convertToSerie(newPoints);
                                //updateNavigator(chart, newPointsData);

                                if (datasetSize < $scope.MAX_POINTS) {
                                    updateSeries(chart, operationType, newPointsData);
                                } else {
                                    //chart.redraw(); // TODO : test s'il est vraiment nécessaire
                                    freeSemaphore(operationType)
                                }
                            } else {
                                console.log('[' + operationType + '] No new points found');
                                freeSemaphore(operationType)
                            }
                        });
                });
            }
        };

        function initSeries(chart, operationType, rawPoints) {
            if (rawPoints.length > 0) {
                var points = convertToSerie(rawPoints);
                chart.get(operationType + '_latency').setData(points);
                chart.get(operationType + '_latency_average').setData(createAverageData(points, getAverage(points)));
                chart.get('nav').setData(points);
                console.log('[' + operationType + '] Chart initialized');
            } else {
                console.log('[' + operationType + '] No points found');
            }
            freeSemaphore(operationType);
            chart.hideLoading();
        }

        $scope.initRoutine = function (chart, operationType) {
            console.log('[' + operationType + '] Initializing chart');
            chart.showLoading('Loading data from server...');

            Benchmarks.getSize($scope.benchmarkName, operationType).success(function (data) {
                var datasetSize = data["results"];
                if (datasetSize > $scope.MAX_POINTS) {
                    var packetSize = Math.ceil(datasetSize / $scope.MAX_POINTS);
                    Benchmarks.getByNameByOperationTypeByQuality($scope.benchmarkName, operationType, 0,
                        "MAX", $scope.MAX_POINTS, packetSize).success(function (data) {
                        initSeries(chart, operationType, data["results"]);
                    });
                } else {
                    Benchmarks.getByNameByOperationType($scope.benchmarkName, operationType).success(function (data) {
                        initSeries(chart, operationType, data["results"]);
                    });
                }
            });
        };

        /*
         $scope.resizeRoutine = function (chart, operationType, from, to) {
         // TODO : verify if semaphore is needed
         console.log('[' + operationType + '] Resizing chart');
         chart.showLoading('Loading data from server...');

         Benchmarks.getSize($scope.benchmarkName, operationType).success(function (data) {
         var datasetSize = data["results"];
         if (datasetSize > $scope.MAX_POINTS) {
         // set serie
         var packetSize = Math.ceil((to - from) / $scope.MAX_POINTS);
         Benchmarks.getByNameByOperationTypeByQuality($scope.benchmarkName, operationType,
         from, to, $scope.MAX_POINTS, packetSize)
         .success(function (data) {
         var qualityPoints = data["results"];

         var qualitySerieData = convertToSerie(qualityPoints);
         var averageData = createAverageData(qualitySerieData, getAverage(qualitySerieData));

         chart.get(operationType + '_latency_average').setData(averageData);
         chart.get(operationType + '_latency').setData(qualitySerieData);
         freeSemaphore(operationType);
         chart.hideLoading();
         });
         }
         });
         };
         */

        /* BUTTONS ROUTINE */

        /**
         * Get all benchmarks names and stores it into $scope
         */
        function getBenchmarkList() {
            Benchmarks.getNames().success(function (data) {
                var nameObjects = data["results"];
                $scope.benchmarkNames = nameObjects.map(function (nameObject) {
                    return nameObject.name;
                });
            });
        }

        $scope.goto = function (path) {
            $location.path(path);
        };

        $scope.deleteBenchmark = function (ev) {
            $scope.loading = true;
            var confirm = $mdDialog.confirm({
                onComplete: function afterShowAnimation() {
                    var $dialog = angular.element(document.querySelector('md-dialog'));
                    var $actionsSection = $dialog.find('md-dialog-actions');
                    var $cancelButton = $actionsSection.children()[0];
                    var $confirmButton = $actionsSection.children()[1];
                    angular.element($confirmButton).addClass('md-raised md-warn');
                    //angular.element($cancelButton).addClass('md-raised');
                }
            })
                .title('Are you sure ?')
                .textContent('Deletion of a benchmark is not reversible once the process is complete.')
                .ariaLabel('Are you sure')
                .targetEvent(ev)
                .ok('Yes I understand the risk')
                .cancel('No');
            $mdDialog.show(confirm).then(function () {
                Benchmarks.delete($scope.benchmarkName)
                    .success(function () {
                        getBenchmarkList();
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent('Benchmark ' + $scope.benchmarkName + ' deleted.')
                                .position("top right")
                                .hideDelay(3000)
                        );
                        $scope.goto("/stats");
                        $scope.loading = false;
                    });
            }, function () {
                // Do something if "no" is answered.
            });
        };

    }
    ]);