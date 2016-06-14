angular.module('benchmarkController', ["highcharts-ng"])
// inject the Benchmark service factory into our controller
    .controller('BenchmarkController', ['$scope', '$http', 'Benchmarks', '$routeParams', function ($scope, $http, Benchmarks, $routeParams) {

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
         * @param averageLatency the average value of the serie from YCSB
         * @param originalSerie the original serie of which we want an average serie
         * @returns {{name: string, data: *}} the average Highchart serie
         */
        function createAverageSerie(averageLatency, originalSerie) {
            var averageDataSerie = originalSerie.data.map(function (measure) {
                return [measure[0], averageLatency];
            });

            return {
                name: 'Average ' + originalSerie.name,
                data: averageDataSerie
            };
        }

        function updateCharts() {
            $scope.operationArray.forEach(function (operationType) {
                var fromDateTimestamp = 0;
                if ($scope.operationTypeToLastValueTimestamp.hasOwnProperty(operationType)) {
                    fromDateTimestamp = $scope.operationTypeToLastValueTimestamp[operationType];

                } else {
                    var timestamps = Object.keys($scope.operationTypeToLastValueTimestamp).map(function (key) {
                        return $scope.operationTypeToLastValueTimestamp[key];
                    });
                    fromDateTimestamp = Math.max.apply(null, timestamps);
                }
                Benchmarks.getByNameByOperationTypeByFromDate($scope.benchmarkName, operationType, fromDateTimestamp)
                    .success(function (records) {
                        if (records.length > 0) {
                            console.log(records);
                            var firstOperationTimestamp = records[0].createdAt;
                            var chartConfigVariableName = operationType.toLowerCase() + 'ChartConfig';

                            // TODO : update graph smoothly with addPoint workaround
                            /*records.forEach(function (point) {
                             $scope.highchartConfigs[chartConfigVariableName].series[0].data
                             .push([firstOperationTimestamp + point.time, point.latency]);
                             // TODO : check if the average if updating as well or 
                             // TODO : calculate average
                             });
                             */
                            // updating timestamps
                            $scope.operationTypeToLastValueTimestamp[operationType]
                                = records[records.length - 1].createdAt;
                            console.log(operationType + " chart updated !");
                        }
                    });
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

        function initCharts() {
            //$scope.highchartConfigs.allChartConfig.title.text = "All operations";
            // For each operation
            var operationLeft = $scope.operationArray.length;
            $scope.operationArray.forEach(function (operationType) {
                // We fetch YCSB results
                Benchmarks.getByNameByOperationType($scope.benchmarkName, operationType)
                    .success(function (records) {
                        // if there is at least one result for this operation in YCSB
                        if (records.length > 0) {
                            // We fectch the average of this operation
                            Benchmarks.getByNameByOperationType($scope.benchmarkName, operationType + '_TOTAL_AVERAGE')
                                .success(function (recordsAverage) {
                                    // We create our HighChart serie
                                    var serie = {
                                        name: operationType + " latency",
                                        data: convertToSerie(records)
                                    };
                                    // We create the HighChart average serie of the operationType
                                    var averageSerie = createAverageSerie(recordsAverage[0].latency, serie);

                                    // We save the last operation timestamp for future updates
                                    $scope.operationTypeToLastValueTimestamp[operationType]
                                        = records[records.length - 1].createdAt;

                                    // We display result in the corresponding chart
                                    displayChart(operationType, [serie, averageSerie]);
                                    --operationLeft;
                                    if (operationLeft <= 0) {
                                        $scope.updateChartInterval = setInterval(updateCharts, 2000);
                                    }
                                });
                        } else {
                            --operationLeft;
                            if (operationLeft <= 0) {
                                $scope.updateChartInterval = setInterval(updateCharts, 2000);
                            }
                        }
                    });
                $scope.loading = false;
            });
        }

        /**
         * VARIABLES DEFINITION BLOCK
         */

        $scope.loading = true;
        $scope.benchmarkName = $routeParams.benchmarkName;
        $scope.operationTypeToLastValueTimestamp = {}; // Map for updating only new points on charts
        $scope.updateChartInterval = null;
        $scope.operationArray = ["INSERT", "READ", "UPDATE", "SCAN", "CLEANUP"];

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
            /*func: function(chart) {
             $timeout(function() {
             chart.reflow();
             $scope.highchart = chart;
             }, 300);

             // TODO : accrocher un event different pour chaque type de graph
             socket.on('ati_sensordata', function(data) {
             if (data) {
             var splited = data.split('|');

             if (splited.length >= 6) {
             var val = parseFloat(splited[5]);
             var shift = chart.series[0].data.length > 100;
             chart.series[0].addPoint(val, true, shift, false);

             }
             }
             });


             },*/
            useHighStocks: true
        };

        $scope.highchartConfigs = {
            //allChartConfig: JSON.parse(JSON.stringify(highchartConfigDefault)),
            insertChartConfig: JSON.parse(JSON.stringify(highchartConfigDefault)),
            readChartConfig: JSON.parse(JSON.stringify(highchartConfigDefault)),
            updateChartConfig: JSON.parse(JSON.stringify(highchartConfigDefault)),
            scanChartConfig: JSON.parse(JSON.stringify(highchartConfigDefault)),
            cleanupChartConfig: JSON.parse(JSON.stringify(highchartConfigDefault))
        }; // charts configurations initilized to the default one

        $scope.stopUpdate = function () {
            clearInterval($scope.updateChartInterval)
        };

        $scope.$on('$destroy', function () {
            $scope.stopUpdate();
        });

        initCharts();
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