angular.module('benchmarkController', ["highcharts-ng"])
// inject the Benchmark service factory into our controller
    .controller('BenchmarkController', ['$scope', '$http', 'Benchmarks', '$routeParams', function ($scope, $http, Benchmarks, $routeParams) {
        $scope.loading = true;
        $scope.benchmarkName = $routeParams.benchmarkName;

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

        $scope.highchartConfigs = {
            allChartConfig: JSON.parse(JSON.stringify(highchartConfigDefault)),
            insertChartConfig: JSON.parse(JSON.stringify(highchartConfigDefault)),
            readChartConfig: JSON.parse(JSON.stringify(highchartConfigDefault)),
            updateChartConfig: JSON.parse(JSON.stringify(highchartConfigDefault)),
            scanChartConfig: JSON.parse(JSON.stringify(highchartConfigDefault)),
            cleanupChartConfig: JSON.parse(JSON.stringify(highchartConfigDefault))
        };

        /**
         * Format stored raw values from YCSB to Highchart formatting
         * @param rawValues YCSB raw DB values
         * @returns {*} Highchart formatted data
         */
        function formatSerie(rawValues) {
            var firstOperationTimestamp = new Date(rawValues[0].createdAt).getTime();
            return rawValues.map(function (measureObj) {
                return [firstOperationTimestamp + measureObj.time, measureObj.latency]
            });
        }

        /**
         * Create an average serie from a value and an original serie
         * @param averageLatency the average value of the serie from YCSB
         * @param originalSerie the original serie of which we want an average serie
         * @returns {{id: string, name: string, data: *}} the average Highchart serie
         */
        function createAverageSerie(averageLatency, originalSerie) {
            var averageDataSerie = originalSerie.data.map(function (measure) {
                return [measure[0], averageLatency];
            });

            return {
                id: originalSerie.id + '_average',
                name: 'Average ' + originalSerie.name,
                data: averageDataSerie
            };
        }

        function rawDataToSeriesMap(dataObject) {
            var operationToSerieMap = {};

            var i = 0;
            var lastValueDate = new Date("01-01-1970").getTime();
            for (var operationType in dataObject) {
                if (dataObject.hasOwnProperty(operationType)) {

                    if (operationType.indexOf('_TOTAL_AVERAGE') <= -1) {
                        // variable initialisation
                        var rawValues = dataObject[operationType]['values'];
                        operationToSerieMap[operationType] = {};

                        // formating raw values into Highchart's format
                        var serieData = formatSerie(rawValues);

                        // we are looking for the last value inserted of the sample we display
                        var lastOperationTimestamp = new Date(rawValues[rawValues.length - 1].createdAt).getTime();
                        if (lastOperationTimestamp > lastValueDate)
                            lastValueDate = lastOperationTimestamp;

                        var serie = {
                            id: i,
                            name: operationType + " latency",
                            data: serieData
                        };

                        var averageSerie = createAverageSerie(dataObject[operationType + '_TOTAL_AVERAGE'].values[0].latency, serie);

                        operationToSerieMap[operationType] = [serie, averageSerie];
                        ++i;
                    }

                }
            }
            return operationToSerieMap;
        }

        Benchmarks.get($scope.benchmarkName)
            .success(function (data) {
                $scope.loading = false;

                var dataObject = {};
                data.forEach(function (obj) {
                    dataObject[obj.operationType] = obj;
                });

                $scope.operationToSerieMap = rawDataToSeriesMap(dataObject);
                $scope.highchartConfigs.allChartConfig.title.text = "All operations";
                for (var operationType in $scope.operationToSerieMap) {
                    console.log($scope.highchartConfigs);
                    if ($scope.operationToSerieMap.hasOwnProperty(operationType)) {
                        console.log(operationType.toLowerCase() + 'ChartConfig');
                        $scope.highchartConfigs[operationType.toLowerCase() + 'ChartConfig'].title.text = operationType + " operations";
                        $scope.operationToSerieMap[operationType].forEach(function (serie) {
                            $scope.highchartConfigs.allChartConfig.series.push(serie);
                            $scope.highchartConfigs[operationType.toLowerCase() + 'ChartConfig'].series.push(serie);
                        })
                    }

                }
            });
    }
    ])
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