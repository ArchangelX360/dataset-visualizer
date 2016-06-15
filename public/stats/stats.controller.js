angular.module('benchmarkController', ["highcharts-ng"])
// inject the Benchmark service factory into our controller
    .controller('BenchmarkController', ['$scope', '$http', 'Benchmarks', '$routeParams', function ($scope, $http, Benchmarks, $routeParams) {

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
            var firstOperationTimestamp = rawValues[0].createdAt;
            return rawValues.map(function (measureObj) {
                return [firstOperationTimestamp + measureObj.time, measureObj.latency]
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
                        var firstOperationTimestamp = records[0].createdAt;
                        var chartConfigVariableName = operationType.toLowerCase() + 'ChartConfig';
                        records.forEach(function (point) {
                            addPoint($scope.highchartConfigs[chartConfigVariableName],
                                [firstOperationTimestamp + point.time, point.latency]);
                        });
                        // updating average serie
                        $scope.highchartConfigs[chartConfigVariableName].series[1] = createAverageSerie($scope.highchartConfigs[chartConfigVariableName].series[0]);
                        // updating timestamps
                        $scope.operationTypeToLastValueTimestamp[operationType]
                            = records[records.length - 1].createdAt;
                        console.log(operationType + " chart updated !");
                    }
                });
            if (callback)
                callback(operationType);
        }

        function updateCharts() {
            $scope.operationArray.forEach(function (operationType) {
                var fromDateTimestamp = $scope.operationTypeToLastValueTimestamp[operationType];
                if (!$scope.updateSemaphore[operationType])
                    fromDateTimestamp <= 0 ? initChart(operationType, freeSemaphore)
                        : updateChart(operationType, fromDateTimestamp, freeSemaphore);
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
                        $scope.operationTypeToLastValueTimestamp[operationType]
                            = records[records.length - 1].createdAt;

                        // We display result in the corresponding chart
                        displayChart(operationType, [serie, averageSerie]);
                    } else {
                    }
                });
            if (callback)
                callback(operationType);
        }

        function initCharts(callback) {
            $scope.operationArray.forEach(function (operationType) {
                initChart(operationType, freeSemaphore)
            });
            // TODO : $scope.loading = false; au bon endroit
            $scope.loading = false;
            if (callback)
                callback();
        }

        function launchChartUpdating() {
            $scope.updateChartInterval = setInterval(updateCharts, 6000);
        }

        function initVariables(operationType) {
            $scope.operationTypeToLastValueTimestamp[operationType] = 0;
            $scope.updateSemaphore[operationType] = false;
            $scope.highchartConfigs[operationType.toLowerCase() + 'ChartConfig']
                = JSON.parse(JSON.stringify(highchartConfigDefault));
        }

        /**
         * VARIABLES DEFINITION BLOCK
         */


        var highchartConfigDefault = {
            options: {
                chart: {
                    zoomType: 'x',
                    height: 700
                },
                rangeSelector: {
                    enabled: true,
                    allButtonsEnabled: true,
                    buttons: [{
                        // TODO : infere this scale from datas
                        type: 'millisecond',
                        count: 200,
                        text: '200ms'
                    }, {
                        type: 'millisecond',
                        count: 400,
                        text: '400ms'
                    }, {
                        type: 'millisecond',
                        count: 600,
                        text: '600ms'
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
            series: [],
            title: {
                text: 'default config'
            },
            useHighStocks: true
        };

        $scope.benchmarkName = $routeParams.benchmarkName;
        $scope.operationTypeToLastValueTimestamp = {}; // Map for updating only new points on charts
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

        initCharts(launchChartUpdating);
    }])
    .controller('BenchmarkListController', ['$scope', '$http', 'Benchmarks', function ($scope, $http, Benchmarks) {
        Benchmarks.getNames().success(function (data) {
            console.log(data);
            $scope.benchmarkNames = data;
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