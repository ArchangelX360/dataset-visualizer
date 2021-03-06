angular.module('stats', [])
    .directive('hcOperationChart', function ($routeParams, Benchmarks, ToastService) {

        function dumpResultsIntoCSV(label) {
            Benchmarks.generateRawDBDump($routeParams.benchmarkName, label).then(function (results) {
                downloadFile('data:text/csv;charset=utf-8;base64,' + btoa(results.data.csv),
                    label + '-dump-' + Date.now() + '.csv',
                    false
                );
                ToastService.showToast(results.data.message, 'success');
            }, function (err) {
                ToastService.showToast(err.data, 'error');
            });
        }

        function downloadFile(uriStr, filename, alreadyEncoded) {
            var encodedUri = alreadyEncoded ? uriStr : encodeURI(uriStr);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
        }

        function createSVGUri(containerId) {
            //get svg element.
            var svg = document.querySelector('#' + containerId + ' svg');

            var serializer = new XMLSerializer();
            var source = serializer.serializeToString(svg);

            //add name spaces.
            if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
                source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
            }
            if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
                source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
            }

            //add xml declaration
            source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

            ToastService.showToast("SVG created.", 'success');

            //convert svg source to URI data scheme.
            return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
        }

        return {
            restrict: 'E',
            template: '<div></div>',
            scope: {
                series: '=',
                id: '@',
                title: '@',
                customlabel: '@',
                seriestype: '@',
                updatefunc: '=',
                initfunc: '=',
                updateinterval: '=',
                fileparser: '=',
                importfunc: '='
            },
            link: function (scope, element) {
                element.on('$destroy', function () {
                    clearInterval(scope.updateinterval)
                });

                Highcharts.StockChart(element[0], {
                    chart: {
                        zoomType: 'x',
                        height: 650,
                        events: {
                            load: function () {
                                // set up the updating of the chart each second
                                var chart = this;
                                if (!scope.fileparser) { // Update if not imported file
                                    scope.initfunc(chart, scope.customlabel);
                                    scope.updateinterval = setInterval(function () {
                                        var extremesObject = chart.get(scope.customlabel + '_xaxis')
                                            .getExtremes();
                                        scope.updatefunc(chart, scope.customlabel,
                                            Math.round(extremesObject.dataMax));
                                    }, 1500);
                                } else {
                                    scope.importfunc(chart, scope.customlabel);
                                }
                            }
                        }
                    },
                    tooltip: {
                        formatter: function () {
                            var s = 'Measure #<b>' + this.x + '</b>';

                            this.points.forEach(function (seriesObject) {
                                var pointValueStr;
                                /* NOTE : you can make your own formatter base on your series type by adding a new case entry */
                                switch (seriesObject.series.type) {
                                    case "line":
                                        pointValueStr = seriesObject.y;
                                        break;
                                    case "candlestick":
                                        pointValueStr = '<br/>' +
                                            'open: ' + seriesObject.point.open + '<br/>' +
                                            'high: ' + seriesObject.point.close + '<br/>' +
                                            'low: ' + seriesObject.point.low + '<br/>' +
                                            'close: ' + seriesObject.point.close + '<br/>';
                                        break;
                                    default:
                                        throw "Series type not supported yet, see our documentation to know how to implement it.";
                                        break;
                                }
                                s += '<br/><span style="color:'
                                    + seriesObject.series.color + '">\u25CF</span> '
                                    + '<b> ' + seriesObject.series.name + '</b>: ' + pointValueStr;
                            });
                            return s;

                        }
                    },
                    exporting: {
                        enabled: true,
                        buttons: {
                            contextButton: {
                                menuItems: [
                                    {
                                        text: 'Download SVG',
                                        onclick: function () {
                                            downloadFile(
                                                createSVGUri(scope.id),
                                                scope.customlabel + '-svg-' + Date.now() + '.svg', true
                                            );
                                        }
                                    },
                                    {
                                        textKey: 'DownloadCSV',
                                        onclick: function () {
                                            this.downloadCSV();
                                        }
                                    },
                                    {
                                        text: 'Download CSV (whole series) [DB DUMP]',
                                        onclick: function () {
                                            dumpResultsIntoCSV(scope.customlabel)
                                        }
                                    },
                                ]
                            }
                        },
                        csv: {
                            dateFormat: '%Y-%m-%dT%H:%M:%S.%L'
                        }
                    },
                    rangeSelector: {
                        enabled: true,
                        allButtonsEnabled: true,
                        buttons: [
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
                        id: scope.customlabel + '_xaxis',
                        labels: {
                            formatter: function () {
                                return this.value;
                            }
                        },
                        events: {
                            afterSetExtremes: function (e) {
                                if (e.trigger === "navigator") {
                                    if (scope.seriestype === "line" && this.chart
                                            .get(scope.customlabel + '_measures_average').processedYData.length > 0) {
                                        // TODO: do a better processing for other types
                                        // TODO: do a better processing for showAverage = false
                                        // Draw the current window average line
                                        var xArray = this.chart.get(scope.customlabel + '_measures').processedXData;
                                        var yArray = this.chart.get(scope.customlabel + '_measures').processedYData;
                                        var total = yArray.reduce(function (previous, current) {
                                            return previous + current;
                                        }, 0);
                                        var average = total / yArray.length;
                                        var averageDataSeries = xArray.map(function (point) {
                                            return [point, average];
                                        });
                                        this.chart.get(scope.customlabel + '_measures_average_current_window')
                                            .setData(averageDataSeries);
                                    }
                                }
                            }
                        },
                    },
                    series: [
                        {
                            type: scope.seriestype,
                            id: scope.customlabel + '_measures',
                            name: scope.customlabel + ' measures',
                            data: []
                        },
                        {
                            type: 'line',
                            id: scope.customlabel + '_measures_average',
                            name: scope.customlabel + ' average',
                            data: []
                        },
                        {
                            type: 'line',
                            id: scope.customlabel + '_measures_average_current_window',
                            name: scope.customlabel + ' current window average',
                            data: []
                        }
                    ],
                    title: {
                        text: scope.title
                    }
                });
            }
        };
    })
    // inject the Benchmark service factory into our controller
    .controller('StatController', ['$scope', '$rootScope', '$http',
        'Benchmarks', 'ImportFiles', '$routeParams', '$mdDialog',
        '$mdToast', '$location', 'ToastService', '$log',
        function ($scope, $rootScope, $http, Benchmarks, ImportFiles, $routeParams,
                  $mdDialog, $mdToast, $location, ToastService, $log) {

            /** CONFIGURATION VARIABLES **/
            $scope.MAX_POINTS = 20000;
            /* maximal number of points you can get from MongoDB (depends on your
             browser/computer performance) and has a undetermined upper limit with NodeJS */
            /* Show average series or not (false is recommanded for non-single value measures) */
            $scope.showAverage = true;
            /* Map with associate label from DB to series type you want */
            $scope.labelTypeMap = {
                "INSERT": "line",
                "READ": "line",
                "UPDATE": "line",
                "READ-MODIFY-WRITE": "line",
                "CLEANUP": "line",
                //"SCAN": "line",
                //"DELETE" : "line",
                //"AAPL Stock Price": "candlestick"
            };
            $scope.supportedImportMeasurementType = ['raw'];
            /* The measurement types supported by the NodeJS server, if you create new parser you need to
             * add them here :) */

            /* VARIABLE INITIALIZATION */

            $scope.intervals = {};
            getBenchmarkList();
            getImportFiles();
            $scope.fileParser = $routeParams.fileParser;
            $scope.importParams = {
                filename: "",
                fileParser: $scope.supportedImportMeasurementType[0]
            };

            $scope.benchmarkName = $routeParams.benchmarkName;
            $rootScope.pageTitle = ($scope.benchmarkName) ? 'Benchmark results' : 'Select a benchmark';
            $scope.currentNavItem = 'nav-' + $scope.benchmarkName;

            $scope.benchmarkName = $routeParams.benchmarkName;
            $scope.updateSemaphore = {}; // Map of semaphores for synchronizing updates
            $scope.packetSizes = {};
            for (var label in $scope.labelTypeMap) {
                if ($scope.labelTypeMap.hasOwnProperty(label)) {
                    $scope.updateSemaphore[label] = true;
                    $scope.packetSizes[label] = 0;
                    $scope.intervals[label] = null;
                }
            }
            $scope.updateIntervalsActive = false;

            /* CHART FUNCTIONS */

            /**
             * Free update semaphore of a specific label chart
             * @param label the label string
             */
            function freeSemaphore(label) {
                $scope.updateSemaphore[label] = false;
            }

            /**
             * Convert stored raw values from YCSB to Highchart formatting for line series
             *
             * @param rawValues YCSB raw DB values
             * @returns {*} Highchart formatted data
             */
            function convertToLineSerie(rawValues) {
                return rawValues.map(function (measureObj) {
                    return [measureObj.num, measureObj.measure]
                });
            }

            /**
             * Convert stored raw values from YCSB to Highchart formatting for candlestick series
             *
             * @param rawValues YCSB raw DB values
             * @returns {*} Highchart formatted data
             */
            function convertToCandlestickSerie(rawValues) {
                return rawValues.map(function (measureObj) {
                    return [
                        measureObj.num,
                        measureObj.measure.open,
                        measureObj.measure.high,
                        measureObj.measure.low,
                        measureObj.measure.close
                    ]
                });
            }

            /**
             * Select the conversion function based on the series type
             *
             * NOTE : you can add you own convertToSerie functions to support any series type!
             *
             * @param seriesType
             * @param rawValues
             * @returns {*}
             */
            function convertToSerieByChartType(seriesType, rawValues) {
                var serie;
                switch (seriesType) {
                    case "line":
                        serie = convertToLineSerie(rawValues);
                        break;
                    case "candlestick":
                        serie = convertToCandlestickSerie(rawValues);
                        break;
                    default:
                        throw "Series type not supported yet, see our documentation to know how to implement it.";
                        break;
                }
                return serie;
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
                var total = serieData.reduce(function (previous, current) {
                    return previous + current[1];
                }, 0);
                return total / serieData.length;
            }

            /**
             * Return points of the series of the given id
             * @param chart the chart object
             * @param id the id of the series
             * @returns {Array} current points in the series
             */
            function getAllDataPoints(chart, id) {
                var points = [];
                var xData = chart.get(id).xData;
                var yData = chart.get(id).yData;
                for (var i = 0; i < xData.length; i++) {
                    points.push([xData[i]].concat(yData[i]));
                }
                return points;
            }

            /**
             * Updates series of a specific label
             * @param chart the chart object
             * @param label the label
             * @param rawPoints the points to add
             * @param packetSize the size of the packet used
             */
            function updateSeries(chart, label, rawPoints, packetSize) {
                if (rawPoints.length > 0) {
                    $log.info('[' + label + '] Updating series');

                    $scope.packetSizes[label] = packetSize;
                    var newPointsData = convertToSerieByChartType(chart.get(label + '_measures').type, rawPoints);
                    var oldPoints = getAllDataPoints(chart, label + '_measures');
                    var completeData = oldPoints.concat(newPointsData);
                    chart.get(label + '_measures').setData(completeData);

                    if ($scope.showAverage) {
                        var originalSerieLength = chart.get(label + '_measures').xData.length;
                        var average = chart.get(label + '_measures_average').yData[0];
                        newPointsData.forEach(function (point) {
                            average = updateAverage(average, originalSerieLength, point[1]);
                        });
                        chart.get(label + '_measures_average').setData(createAverageData(completeData, average));
                    }

                    $log.info('%c[' + label + '] Chart updated', 'color: green');
                } else {
                    $log.info('%c[' + label + '] No new points found', 'color: orange');
                }
                chart.hideLoading();
                freeSemaphore(label)
            }

            /**
             * Update routine that decide if the chart needs a full update, a partial update or an init
             * @param chart the chart object
             * @param label the label
             * @param lastInserted the number (num) of the last inserted point into the specified operation chart
             */
            $scope.updateRoutine = function (chart, label, lastInserted) {
                if (!$scope.updateSemaphore[label]) {
                    $log.info('[' + label + '] Updating chart');
                    $scope.updateSemaphore[label] = true;

                    Benchmarks.getSize($scope.benchmarkName, label).then(function (result) {
                        var datasetSize = result.data;
                        if (datasetSize > $scope.MAX_POINTS) {
                            var packetSize = Math.floor(datasetSize / $scope.MAX_POINTS) + 1;

                            if (packetSize != $scope.packetSizes[label]) {
                                // FIXME: careful this should decrease view performance a lot !
                                lastInserted = 0; // We are rebuilding the whole series to have quality consistency
                            }

                            Benchmarks.getByNameByLabelByQuality($scope.benchmarkName, label,
                                lastInserted, "MAX", $scope.MAX_POINTS, packetSize, chart.get(label + '_measures').type)
                                .then(function (result) {
                                    var newPoints = result.data;
                                    if (packetSize != $scope.packetSizes[label]) {
                                        initSeries(chart, label, newPoints, packetSize);
                                    } else {
                                        updateSeries(chart, label, newPoints, packetSize);
                                    }
                                }, function (err) {
                                    ToastService.showToast(err.data, 'error');
                                });
                        } else {
                            Benchmarks.getByNameByLabelFrom($scope.benchmarkName, label, lastInserted)
                                .then(function (result) {
                                    var newPoints = result.data;

                                    if ($scope.packetSizes[label] == 0) {
                                        initSeries(chart, label, newPoints, 1);
                                    } else {
                                        updateSeries(chart, label, newPoints, 1);
                                    }
                                }, function (err) {
                                    ToastService.showToast(err.data, 'error');
                                });
                        }
                    }, function (err) {
                        ToastService.showToast(err.data, 'error');
                    });
                }
            };

            /**
             * Initialize a specified operation chart
             * @param chart the chart object
             * @param label the label
             * @param rawPoints points use for initialisation
             * @param packetSize the size of packet used for this initialization
             */
            function initSeries(chart, label, rawPoints, packetSize) {
                if (rawPoints.length > 0) {
                    $log.info('[' + label + '] Initializing series');

                    $scope.packetSizes[label] = packetSize;

                    var points = convertToSerieByChartType(chart.get(label + '_measures').type, rawPoints);
                    chart.get(label + '_measures').setData(points);

                    if ($scope.showAverage) {
                        chart.get(label + '_measures_average').setData(createAverageData(points, getAverage(points)));
                    }

                    $log.info('%c[' + label + '] Chart initialized', 'color: green');
                    chart.hideLoading();
                } else {
                    chart.showLoading('No data found.');
                    $log.info('%c[' + label + '] No points found', 'color: orange');
                }
                $scope.updateIntervalsActive = true;
                freeSemaphore(label);
            }

            /**
             * Initialization routine which define if the chart should be init full all points or with a smaller amount
             * @param chart the object chart
             * @param label the label
             */
            $scope.initRoutine = function (chart, label) {
                $log.info('[' + label + '] Initializing chart');
                chart.showLoading('Loading data from server...');

                Benchmarks.getSize($scope.benchmarkName, label).then(function (result) {
                    var datasetSize = result.data;
                    if (datasetSize > $scope.MAX_POINTS) {
                        var packetSize = Math.floor(datasetSize / $scope.MAX_POINTS) + 1;
                        Benchmarks.getByNameByLabelByQuality($scope.benchmarkName, label, 0,
                            "MAX", $scope.MAX_POINTS, packetSize, chart.get(label + '_measures').type)
                            .then(function (result) {
                                var rawPoints = result.data;
                                initSeries(chart, label, rawPoints, packetSize);
                            }, function (err) {
                                console.log(err);
                                ToastService.showToast(err.data, 'error');
                            });
                    } else {
                        Benchmarks.getByNameByLabel($scope.benchmarkName, label)
                            .then(function (result) {
                                var rawPoints = result.data;
                                initSeries(chart, label, rawPoints, 1);
                            }, function (err) {
                                ToastService.showToast(err.data, 'error');
                            });
                    }
                }, function (err) {
                    ToastService.showToast(err.data, 'error');
                });
            };

            /**
             * Initialization with imported file
             * @param chart the object chart
             * @param label the label
             */
            $scope.initWithFile = function (chart, label) {
                ImportFiles.getImportFileContent($scope.benchmarkName, label, $scope.fileParser).then(function (content) {
                    initSeries(chart, label, content.data, 1);
                }, function (err) {
                    if (err.data.hasOwnProperty('code')) {
                        console.log(err);
                        ToastService.showToast(ToastService.parseFsError(err.data), 'error');
                    } else {
                        ToastService.showToast(err.data, 'error');
                    }
                });
            };

            /**
             * Clears all chart update intervals
             */
            $scope.clearUpdateIntervals = function () {
                for (var label in $scope.intervals) {
                    if ($scope.intervals.hasOwnProperty(label)) {
                        clearInterval($scope.intervals[label]);
                        $log.info("%c[" + label + "] Update interval cleared.", 'color: rgb(68,138,255)');
                    }
                }
                $scope.updateIntervalsActive = false;
                ToastService.showToast("Updates stopped.", 'warn');
            };

            /* DELETION FUNCTIONS */

            /**
             * Launch specified benchmark DB deletion
             * @param benchmarkName the name of the benchmark
             */
            function deleteBenchmark(benchmarkName) {
                Benchmarks.delete(benchmarkName)
                    .then(function () {
                        ToastService.showToast('Benchmark ' + benchmarkName + ' deleted.', 'warn');
                        $location.path("/stats");
                        $scope.loading = false;
                    }, function (err) {
                        ToastService.showToast(err.data, 'error');
                    });
            }

            /**
             * Shows confirm popup to delete a benchmark and launches its deletion if user answer yes
             * @param ev the event
             */
            $scope.confirmDeletionBenchmark = function (ev) {
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
                    $scope.loading = true;
                    deleteBenchmark($scope.benchmarkName);
                }, function () {
                    // Do something if "no" is answered.
                });
            };

            /* CONTENT/NAV FUNCTIONS */

            /**
             * Get benchmark name list to fill the nav
             */
            function getBenchmarkList() {
                Benchmarks.getNames().then(function (result) {
                    $scope.benchmarkNames = result.data;
                }, function (err) {
                    ToastService.showToast(err.data, 'error');
                })
            }

            /**
             * Get import file names to fill the import select
             */
            function getImportFiles() {
                ImportFiles.getImportFileNames().then(function (result) {
                    $scope.importFiles = result.data;
                }, function (err) {
                    if (err.data.hasOwnProperty('code')) {
                        ToastService.showToast(ToastService.parseFsError(err.data), 'error');
                    } else {
                        ToastService.showToast(err.data, 'error');
                    }
                });
            }

        }
    ]);