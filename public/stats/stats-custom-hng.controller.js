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
                initfunc: '='
            },
            link: function (scope, element) {
                Highcharts.StockChart(element[0], {
                    chart: {
                        zoomType: 'x',
                        height: 650,
                        events: {
                            load: function () {
                                // set up the updating of the chart each second
                                var chart = this;
                                scope.initfunc(chart, scope.operation);
                                setInterval(function () {
                                    var extremesObject = chart.xAxis[0].getExtremes();
                                    scope.updatefunc(chart, scope.operation,
                                        Math.round(extremesObject.min), Math.round(extremesObject.max), false);
                                }, 1000);
                            }
                        }
                    },
                    tooltip: {
                        formatter: function () {
                            var s = 'Timestamp: <b>' + this.x / 1000000 + '</b>';

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
                                count: 50000000,
                                text: '50ms'
                            }, {
                                type: 'millisecond',
                                count: 100000000,
                                text: '100ms'
                            }, {
                                type: 'millisecond',
                                count: 300000000,
                                text: '300ms'
                            }, {
                                type: 'millisecond',
                                count: 800000000,
                                text: '800ms'
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
                        adaptToUpdatedData: false,
                        series: {
                            includeInCSVExport: false,
                            id: 'nav'
                        }
                    },
                    xAxis: {
                        events: {
                            afterSetExtremes: function (e) {
                                scope.updatefunc(this.chart, scope.operation,
                                    Math.round(e.min), Math.round(e.max), true);
                            }
                        }
                    },
                    minRange: 1, // one millisecond
                    labels: {
                        formatter: function () {
                            return (this.value / 1000000);
                        }
                    },
                    series: [{}]
                });
            }
        };
    })

    // inject the Benchmark service factory into our controller
    .controller('StatController', ['$scope', '$rootScope', '$http', 'Benchmarks', '$routeParams', '$mdSidenav', '$mdDialog', '$mdToast', '$location', '$q', function ($scope, $rootScope, $http, Benchmarks, $routeParams, $mdSidenav, $mdDialog, $mdToast, $location, $q) {

        $scope.benchmarkName = $routeParams.benchmarkName;
        $rootScope.pageTitle = 'Benchmark results';
        $scope.currentNavItem = 'nav-' + $scope.benchmarkName;
        $scope.MAX_POINTS = 10000;
        $scope.updateSemaphore = {}; // Map of semaphores for synchronizing updates
        $scope.operationArray = ["INSERT", "READ", "UPDATE", "SCAN", "CLEANUP"];
        $scope.operationArray.forEach(function (operationType) {
            $scope.updateSemaphore[operationType] = false;
        });

        /**
         * Convert stored raw values from YCSB to Highchart formatting
         * @param rawValues YCSB raw DB values
         * @returns {*} Highchart formatted data
         */
        function convertToSerie(rawValues) {
            return rawValues.map(function (measureObj) {
                return [measureObj.createdAt, measureObj.latency]
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
         * @param serie the original serie of which we want an average serie
         * @param value the average
         * @returns {{name: string, data: *}} the average Highchart serie
         */
        function createAverageData(serie, value) {
            // FIXME: possible million iterations
            return serie.data.map(function (point) {
                return [point[0], value];
            })
        }

        /**
         * Return the serie average with an O(n) complexity algorithm
         * @param serie the serie
         * @returns {number} the average of the serie
         */
        function getAverage(serie) {
            var total = serie.data.reduce(function (previous, current) {
                return previous + current[1];
            }, 0);
            return total / serie.data.length;
        }

        function updateSeries(chart, operationType, bestPoints, qualityPoints, resize, isLargeDataset) {
            // TODO : split ?
            var average;
            if (!resize) {
                console.log("updating");
                var bestData = convertToSerie(bestPoints);
                chart.get('nav').setData(chart.get('nav').data.push(bestData));
                if (!isLargeDataset) {
                    // update
                    var originalSerieLength = chart.get(operationType + '_latency').points.length;
                    average = chart.get(operationType + '_latency_average').points[0][1];

                    qualityPoints.forEach(function (point) {
                        average = updateAverage(average, originalSerieLength, point.latency);
                        chart.get(operationType + '_latency').addPoint([point.createdAt, point.latency]);
                    });
                    chart.get(operationType + '_latency_average').setData(
                        createAverageData(chart.get(operationType + '_latency'), average));
                }
            } else {
                console.log("resizing");

                if (isLargeDataset) {
                    // set serie

                    var qualitySerie = convertToSerie(qualityPoints);
                    var averageData = createAverageData(qualitySerie, getAverage(qualitySerie));

                    chart.get(operationType + '_latency_average').setData(averageData);
                    chart.get(operationType + '_latency').setData(qualitySerie);
                }
            }
            $scope.updateSemaphore[operationType] = false;
        }

        $scope.updateRoutine = function (chart, operationType, from, to, resize) {
            if (!$scope.updateSemaphore[operationType]) {
                $scope.updateSemaphore[operationType] = true;

                if (resize)
                    console.log("resize");
                else
                    console.log("update");


                Benchmarks
                    .getByNameByOperationTypeByFromDate($scope.benchmarkName, operationType, to)
                    .success(function (data) {
                        var newBestPoints = data["results"];
                        if (newBestPoints.length > 0) {
                            var originalSerieLength = chart.get(operationType + '_latency').points.length;

                            if ((originalSerieLength + newBestPoints.length > $scope.MAX_POINTS)) {
                                var last = newBestPoints[newBestPoints.length - 1].createdAt;
                                Benchmarks
                                    .getByNameByOperationTypeByFromDateToDate($scope.benchmarkName, operationType, from, last)
                                    .success(function (data) {
                                        var qualityPoints = data["results"];
                                        updateSeries(chart, operationType, newBestPoints, qualityPoints, resize, true);
                                    });
                            } else {
                                updateSeries(chart, operationType, newBestPoints, newBestPoints, resize, false);
                            }
                        } else {
                            console.log("No new points");
                        }
                    });
            }
        };

        function initSeries(chart, operationType, qualityPoints) {
            var serie = {
                id: operationType + '_latency',
                name: operationType + ' latency',
                data: convertToSerie(qualityPoints)
            };

            var averageSerie = {
                id: serie.id + '_average',
                name: 'Average ' + serie.name,
                data: createAverageData(serie, getAverage(serie))
            };

            console.log(serie);
            console.log(averageSerie);

            // TODO : pop first tmp series ?
            chart.addSeries(serie);
            chart.addSeries(averageSerie);
            chart.get('nav').setData(serie.data);
        }

        $scope.initRoutine = function (chart, operationType) {
            console.log("init");

            Benchmarks.getByNameByOperationType($scope.benchmarkName, operationType).success(function (data) {
                var bestPoints = data["results"];
                if ((bestPoints.length > 10000)) {
                    Benchmarks.getByNameByOperationTypeByFromDateToDate($scope.benchmarkName, operationType, 0,
                        bestPoints[bestPoints.length - 1].createdAt).success(function (data) {
                        var qualityPoints = data["results"];
                        initSeries(chart, operationType, qualityPoints)
                    });
                } else {
                    initSeries(chart, operationType, bestPoints)
                }
            });
        };
    }]);