angular.module('benchmarkController', ["highcharts-ng"])
// inject the Benchmark service factory into our controller
    .controller('BenchmarkController', ['$scope', '$rootScope', '$http', 'Benchmarks', '$routeParams', '$mdSidenav', '$mdDialog', '$mdToast', '$location', function ($scope, $rootScope, $http, Benchmarks, $routeParams, $mdSidenav, $mdDialog, $mdToast, $location) {

        $scope.loading = true;

        /**
         * FONCTION DEFINITION BLOCK
         */

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
         * Create an average serie from a value and an original serie
         * @param serie the original serie of which we want an average serie
         * @returns {{name: string, data: *}} the average Highchart serie
         */
        function createAverageSerie(serie) {
            var total = serie.data.reduce(function (previous, current) {
                return previous + current[1];
            }, 0);
            var average = total / serie.data.length;
            var averageSerieData = serie.data.map(function (point) {
                return [point[0], average];
            });
            return {
                name: 'Average ' + serie.name,
                data: averageSerieData
            };
        }

        /**
         * Add a point to the chart's serie
         * @param chartOption option of the chart to access the serie
         * @param point couple to add [timestamp, value]
         * @param serieIndex index of the serie
         */
        function addPoint(chartOption, point, serieIndex) {
            chartOption.series[serieIndex].data.push(point);
        }

        /**
         * Free update semaphore of a specific operationType chart
         * @param operationType the operationType string
         */
        function freeSemaphore(operationType) {
            $scope.updateSemaphore[operationType] = false;
        }

        /**
         * Update the chart points with new points in DB from the fromDateTimestamp to now
         * @param operationType the operationType string
         * @param fromDateTimestamp the timestamp of the date from which we should update points
         * @param callback a callback function
         */
        function updateChart(operationType, fromDateTimestamp, callback) {
            $scope.updateSemaphore[operationType] = true;
            Benchmarks.getByNameByOperationTypeByFromDate($scope.benchmarkName, operationType, fromDateTimestamp)
                .success(function (records) {
                    if (records.length > 0) {
                        var chartConfigVariableName = operationType.toLowerCase() + 'ChartConfig';
                        records.forEach(function (point) {
                            addPoint($scope.highchartConfigs[chartConfigVariableName],
                                [point.createdAt, point.latency], 0);
                        });
                        // updating average serie
                        $scope.highchartConfigs[chartConfigVariableName].series[1]
                            = createAverageSerie($scope.highchartConfigs[chartConfigVariableName].series[0]);
                        // updating timestamps
                        $scope.operationTypeToLastValueDisplayed[operationType] = records[records.length - 1];
                        console.log(operationType + " chart updated !");
                    }
                })
                .then(function () {
                    if (callback)
                        callback(operationType);
                });
        }

        /**
         * Updates all charts or initialize not initialized charts and update the benchmarks list
         */
        function updateChartView() {
            getBenchmarkList();
            $scope.operationArray.forEach(function (operationType) {
                var lastValueDisplayed = $scope.operationTypeToLastValueDisplayed[operationType];
                if (!$scope.updateSemaphore[operationType])
                    !lastValueDisplayed.hasOwnProperty("createdAt") ? initChart(operationType, freeSemaphore)
                        : updateChart(operationType, lastValueDisplayed.createdAt, freeSemaphore);
            });
        }

        /**
         * Activate the chart view and initialize values for an operationType
         * @param operationType string of the operationType processed
         * @param series Highchart data series for the operationType chart
         */
        function displayChart(operationType, series) {
            var chartConfigVariableName = operationType.toLowerCase() + 'ChartConfig';
            // Defining the chart title will activate its visualisation on the view
            $scope.highchartConfigs[chartConfigVariableName].title.text = operationType + " operations";

            // Adding series to the specific operation chart and to the all operations chart
            series.forEach(function (serie) {
                //$scope.highchartConfigs.allChartConfig.series.push(serie);
                $scope.highchartConfigs[chartConfigVariableName].series.push(serie);
            })
        }

        /**
         * Initialize chart of an specified operationType creating its series and displaying it
         * If there is no data for the specified operationType, its graph is not initialized.
         * @param operationType the operationType string
         * @param callback a callback function
         */
        function initChart(operationType, callback) {
            $scope.updateSemaphore[operationType] = true;
            // We fetch YCSB results
            Benchmarks.getByNameByOperationType($scope.benchmarkName, operationType)
                .success(function (records) {
                    // if there is at least one result for this operation in YCSB
                    if (records.length > 0) {
                        // We create our HighChart serie
                        var serie = {
                            name: operationType + " latency",
                            data: convertToSerie(records)
                        };
                        // We create the HighChart average serie of the operationType
                        var averageSerie = createAverageSerie(serie);

                        // We save the last operation timestamp for future updates
                        $scope.operationTypeToLastValueDisplayed[operationType] = records[records.length - 1];

                        // We display result in the corresponding chart
                        displayChart(operationType, [serie, averageSerie]);
                        console.log(operationType + " chart init !");
                    }
                })
                .then(function () {
                    $scope.loading = false;
                    if (callback)
                        callback(operationType);
                });
        }

        /**
         * Initialize all operationType charts
         */
        function initCharts() {
            $scope.loading = true;
            $scope.operationArray.forEach(function (operationType) {
                initChart(operationType, freeSemaphore)
            });
        }

        /**
         * Launch the charts updating process
         */
        function launchChartUpdating() {
            $scope.updateChartInterval = setInterval(updateChartView, 1000);
        }

        /**
         * Initialize all variables of an operationType including maps' keys, chart options and update semaphore.
         * @param operationType the operationType string
         */
        function initVariables(operationType) {
            $scope.operationTypeToLastValueDisplayed[operationType] = {};
            $scope.updateSemaphore[operationType] = false;
            $scope.highchartConfigs[operationType.toLowerCase() + 'ChartConfig'] = {
                options: {
                    chart: {
                        zoomType: 'x',
                        height: 650
                    },
                    exporting: {
                        csv: {
                            dateFormat: '%Y-%m-%dT%H:%M:%S.%L'
                        }
                    },
                    rangeSelector: {
                        enabled: true,
                        allButtonsEnabled: true,
                        buttons: [{
                            // TODO : infere this scale from datas
                            type: 'millisecond',
                            count: 50,
                            text: '50ms'
                        }, {
                            type: 'millisecond',
                            count: 100,
                            text: '100ms'
                        }, {
                            type: 'millisecond',
                            count: 300,
                            text: '300ms'
                        }, {
                            type: 'millisecond',
                            count: 800,
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
                        series: {
                            includeInCSVExport: false
                        }
                    }
                },
                xAxis: {
                    type: "datetime",
                    units: [[
                        'millisecond', // unit name
                        [1, 2, 5, 10, 20, 25, 50, 100, 200, 500] // allowed multiples
                    ], [
                        'second',
                        [1, 2, 5, 10, 15, 30]
                    ], [
                        'minute',
                        [1, 2, 5, 10, 15, 30]
                    ], [
                        'hour',
                        [1, 2, 3, 4, 6, 8, 12]
                    ], [
                        'day',
                        [1]
                    ], [
                        'week',
                        [1]
                    ], [
                        'month',
                        [1, 3, 6]
                    ], [
                        'year',
                        null
                    ]]
                },
                // Stores the chart object into a scope variable to use Highcharts functionnalities
                // not implemented by highchart-ng
                func: function (chart) {
                    $scope.highchartCharts[operationType.toLowerCase() + 'Chart'] = chart;
                },
                series: [],
                title: {
                    text: 'default config'
                },
                useHighStocks: true
            };
        }

        /**
         * Get all benchmarks names and stores it into $scope
         */
        function getBenchmarkList() {
            Benchmarks.getNames().success(function (nameObjects) {
                $scope.benchmarkNames = nameObjects.map(function (nameObject) {
                    return nameObject.name;
                });
            });
        }

        /**
         * VARIABLES DEFINITION BLOCK
         */

        $scope.benchmarkName = $routeParams.benchmarkName;
        $rootScope.pageTitle = 'Benchmark results';
        $scope.currentNavItem = 'nav-' + $scope.benchmarkName;
        $scope.operationTypeToLastValueDisplayed = {}; // Map for updating only new points on charts
        $scope.highchartConfigs = {}; // Map for chart configs
        $scope.highchartCharts = {}; // Map for charts
        $scope.updateSemaphore = {}; // Map of semaphores for synchronizing updates
        $scope.updateChartInterval = null;
        $scope.operationArray = ["INSERT", "READ", "UPDATE", "SCAN", "CLEANUP"];

        $scope.operationArray.forEach(initVariables);

        /* Some $scope functions */

        $scope.stopChartUpdating = function () {
            clearInterval($scope.updateChartInterval)
        };

        $scope.$on('$destroy', function () {
            $scope.stopChartUpdating();
            $scope.operationArray.forEach(initVariables);
        });

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

        /* View initialization */

        getBenchmarkList();
        initCharts();
        launchChartUpdating();
    }])
    .controller('BenchmarkListController', ['$scope', '$rootScope', '$http', 'Benchmarks', function ($scope, $rootScope, $http, Benchmarks) {
        $rootScope.pageTitle = 'Select a benchmark';
        Benchmarks.getNames().success(function (nameObjects) {
            $scope.benchmarkNames = nameObjects.map(function (nameObject) {
                return nameObject.name;
            });
        });
    }]);