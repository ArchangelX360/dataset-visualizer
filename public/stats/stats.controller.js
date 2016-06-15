angular.module('benchmarkController', ["highcharts-ng"])
// inject the Benchmark service factory into our controller
    .controller('BenchmarkController', ['$scope', '$http', 'Benchmarks', '$routeParams', '$mdSidenav', '$location', function ($scope, $http, Benchmarks, $routeParams, $mdSidenav, $location) {

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

        function addPoint(chartOption, point) {
            chartOption.series[0].data.push(point);
        }

        function freeSemaphore(operationType) {
            $scope.updateSemaphore[operationType] = false;
        }

        function updateChart(operationType, fromDateTimestamp, callback) {
            $scope.updateSemaphore[operationType] = true;
            Benchmarks.getByNameByOperationTypeByFromDate($scope.benchmarkName, operationType, fromDateTimestamp)
                .success(function (records) {
                    if (records.length > 0) {
                        var chartConfigVariableName = operationType.toLowerCase() + 'ChartConfig';
                        records.forEach(function (point) {
                            addPoint($scope.highchartConfigs[chartConfigVariableName],
                                [point.createdAt, point.latency]);
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

        function updateCharts() {
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

        function initCharts() {
            $scope.loading = true;
            $scope.operationArray.forEach(function (operationType) {
                initChart(operationType, freeSemaphore)
            });
        }

        function launchChartUpdating() {
            $scope.updateChartInterval = setInterval(updateCharts, 200);
        }

        function initVariables(operationType) {
            $scope.operationTypeToLastValueDisplayed[operationType] = {};
            $scope.updateSemaphore[operationType] = false;
            $scope.highchartConfigs[operationType.toLowerCase() + 'ChartConfig']
                = JSON.parse(JSON.stringify(highchartConfigDefault));
        }

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

        var highchartConfigDefault = {
            options: {
                chart: {
                    zoomType: 'x',
                    height: 650
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
                    enabled: true
                }
            },
            xAxis: {
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
            series: [],
            title: {
                text: 'default config'
            },
            useHighStocks: true
        };

        $scope.benchmarkName = $routeParams.benchmarkName;
        $scope.currentNavItem = 'nav-' + $scope.benchmarkName;
        $scope.operationTypeToLastValueDisplayed = {}; // Map for updating only new points on charts
        $scope.highchartConfigs = {}; // Map for chart configs
        $scope.updateSemaphore = {}; // Map of semaphores for synchronizing updates
        $scope.updateChartInterval = null;
        $scope.operationArray = ["INSERT", "READ", "UPDATE", "SCAN", "CLEANUP"];

        $scope.operationArray.forEach(initVariables);

        $scope.stopChartUpdating = function () {
            clearInterval($scope.updateChartInterval)
        };

        $scope.$on('$destroy', function () {
            $scope.stopChartUpdating();
            $scope.operationArray.forEach(initVariables);
        });

        $scope.openLeftMenu = function () {
            $mdSidenav('benchmarkList').toggle();
        };

        $scope.goto = function (path) {
            $location.path(path);
        };

        getBenchmarkList();
        initCharts();
        launchChartUpdating();
    }])
    .controller('BenchmarkListController', ['$scope', '$http', 'Benchmarks', function ($scope, $http, Benchmarks) {
        Benchmarks.getNames().success(function (nameObjects) {
            $scope.benchmarkNames = nameObjects.map(function (nameObject) {
                return nameObject.name;
            });
        });
    }]);


// CREATE ==================================================================
// when submitting the add form, send the text to the node API
/*$scope.createBenchmark = function() {

 // validate the formData to make sure that something is there
 // if form is empty, nothing will happen
 if ($scope.formData.text != undefined) {
 $scope.loading = true;

 // call the create function from our service (returns a promise object)
 Benchmarks.create($scope.formData)

 // if successful creation, call our get function to get all the new benchmarks
 .success(function(data) {
 $scope.loading = false;
 $scope.formData = {}; // clear the form so our user is ready to enter another
 $scope.benchmarks = data; // assign our new list of benchmarks
 });
 }
 };

 // DELETE ==================================================================
 // delete a benchmark after checking it
 $scope.deleteBenchmark = function(id) {
 $scope.loading = true;

 Benchmarks.delete(id)
 // if successful creation, call our get function to get all the new benchmarks
 .success(function(data) {
 $scope.loading = false;
 $scope.benchmarks = data; // assign our new list of benchmarks
 });
 };*/