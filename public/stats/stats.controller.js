angular.module('benchmarkController', ["highcharts-ng"])
// inject the Benchmark service factory into our controller
    .controller('BenchmarkController', ['$scope', '$http', 'Benchmarks', '$routeParams', function ($scope, $http, Benchmarks, $routeParams) {
        $scope.loading = true;

        $scope.benchmarkName = $routeParams.benchmarkName;

        function arrangeData(dataObject) {
            var operationToSerie = {};

            var i = 0;
            for (var operationType in dataObject) {
                if (operationType.indexOf('_TOTAL_AVERAGE') <= -1) {
                    var operationObject = dataObject[operationType];
                    operationToSerie[operationType] = {};

                    var now = new Date(operationObject['values'][0].createdAt).getTime();
                    var stockDataArray = operationObject['values'].map(function (measureObj) {
                        return [now + measureObj.time, measureObj.latency]
                    });

                    var serie = {
                        id: i,
                        name: operationType + " latency",
                        data: stockDataArray
                    };

                    var averageLatency = dataObject[operationType + '_TOTAL_AVERAGE'].values[0].latency;

                    var averageDataSerie = serie.data.map(function (measure) {
                        return [measure[0], averageLatency];
                    });

                    var averageSerie = {
                        id: i + 'average',
                        name: operationType + ' average',
                        data: averageDataSerie
                    };

                    operationToSerie[operationType] = [serie, averageSerie];
                    ++i;
                }
            }
            return operationToSerie;
        }

        Benchmarks.get($scope.benchmarkName)
            .success(function (data) {
                $scope.loading = false;

                var dataObject = {};
                data.forEach(function (obj) {
                    dataObject[obj.operationType] = obj;
                });

                $scope.operationToSerie = arrangeData(dataObject);

                $scope.chartConfig = {
                    options: {
                        chart: {
                            zoomType: 'x',
                            height: 700
                        },
                        rangeSelector: {
                            enabled: true,
                            allButtonsEnabled: true,
                            buttons: [{
                                type: 'millisecond',
                                count: 50,
                                text: '50ms',
                            }, {
                                type: 'millisecond',
                                count: 100,
                                text: '100ms',
                            }, {
                                type: 'millisecond',
                                count: 200,
                                text: '200ms',
                            }, {
                                type: 'millisecond',
                                count: 800,
                                text: '800ms',
                            }, {
                                type: 'all',
                                text: 'All',
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
                        text: 'All operations'
                    },
                    useHighStocks: true
                };

                for (var operationType in $scope.operationToSerie) {
                    var serieAndAverage = $scope.operationToSerie[operationType];
                    serieAndAverage.forEach(function (serie) {
                        $scope.chartConfig.series.push(serie);
                    })
                }
            });

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
    }
    ])
    .controller('BenchmarkListController', ['$scope', '$http', 'Benchmarks', function ($scope, $http, Benchmarks) {
        Benchmarks.getNames().success(function (data) {
            console.log(data);
            $scope.benchmarkNames = data;
        });
    }]);