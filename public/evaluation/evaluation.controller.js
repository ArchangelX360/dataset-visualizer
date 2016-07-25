angular.module('evaluationController', [])
    .directive('hcEvaluationChart', function () {
        return {
            restrict: 'E',
            template: '<div></div>',
            scope: {
                title: '@',
                initfunc: '=',
                file: '@',
                yaxistitle: '@',
                type: '@',
                charttype: '@',
                xaxistype: '@',
            },
            link: function (scope, element) {
                Highcharts.theme = {
                    colors: ["#f44336", "#2196f3", "#cddc39"],
                };
                Highcharts.setOptions(Highcharts.theme);
                Highcharts.chart(element[0], {
                    chart: {
                        width: 400,
                        height: 380,
                        type: scope.charttype,
                        events: {
                            load: function () {
                                var chart = this;
                                scope.initfunc(chart, scope.file, scope.type);
                            }
                        }
                    },
                    title: {
                        text: scope.title
                    },
                    xAxis: {
                        type: scope.xaxistype
                    },
                    yAxis: {
                        title: {
                            text: scope.yaxistitle
                        }
                    },
                    tooltip: {
                        shared: true
                    },
                    series: []
                });
            }
        };
    })
    .controller('EvaluationController', function ($scope, $rootScope, $routeParams, $mdSidenav, $location, Evaluations, ToastService) {
        $scope.loading = true;

        $scope.initDataChart = function (chart, filename, phase) {
            Evaluations.getResults(filename).then(function (response) {
                    var data = response.data.data;
                    var frontendData = [];
                    var rawData = [];

                    data.sort(function (a, b) {
                        return (a.iteration > b.iteration) ? 1 : ((b.iteration > a.iteration) ? -1 : 0);
                    });

                    data.forEach(function (resultObject) {
                        if (resultObject.type === "frontend") {
                            frontendData.push(resultObject[phase])
                        } else {
                            rawData.push(resultObject[phase])
                        }
                    });

                    chart.xAxis[0].setTitle({text: "Iteration number"}, true);

                    chart.addSeries({
                        name: 'Raw',
                        data: rawData
                    });

                    chart.addSeries({
                        name: 'Frontend',
                        data: frontendData
                    });


                },
                function (err) {
                    ToastService.showToast(err.data, "error");
                }
            );
        };

        $scope.initResultChart = function (chart, filename, resultType) {
            Evaluations.getResults(filename).then(function (response) {
                    var data = response.data.results[resultType];
                    var highchartsData = [];

                    for (var cycleType in data) {
                        if (data.hasOwnProperty(cycleType)) {
                            var value = data[cycleType];
                            if (resultType === "percents") {
                                value -= 100;
                                chart.yAxis[0].setExtremes(-100, 100, true)
                            }
                            highchartsData.push([cycleType, value])
                        }
                    }

                    chart.addSeries({
                        colorByPoint: true,
                        name: 'Evaluation results',
                        showInLegend: false,
                        data: highchartsData
                    });
                },
                function (err) {
                    ToastService.showToast(err.data, "error");
                }
            );
        };

        $scope.getEvaluations = function () {
            Evaluations.getFilenames().then(function (result) {
                $scope.evaluations = result.data;
                $scope.loading = false;
            }, function (err) {
                if (err.data.hasOwnProperty('code')) {
                    ToastService.showToast(ToastService.parseFsError(err.data), 'error');
                } else {
                    ToastService.showToast(err.data, 'error');
                }
            });
        };

        function parseEvaluationName(name) {
            var array = name.split('-');
            array.forEach(function (e) {
                switch (e[0]) {
                    case 'I':
                        $scope.iterationNumber = e.substr(1).replace(/\.json/g, '');
                        break;
                    case 'W':
                        $scope.workload = e.substr(1).replace(/\.json/g, '');
                        break;
                    case 'M':
                        $scope.memcachedAddress = e.substr(1).replace(/\.json/g, '');
                        if ($scope.memcachedAddress.split(':')[0] !== "127.0.0.1" && $scope.memcachedAddress.split(':')[0] !== "localhost")
                            $scope.memcachedAddress = "Memcached: Remote (" + $scope.memcachedAddress + ')';
                        else
                            $scope.memcachedAddress = "Memcached: Local (" + $scope.memcachedAddress + ')';
                        break;
                    case 'S':
                        $scope.mongo = e.substr(1).replace(/\.json/g, '');
                        if ($scope.mongo.split(':')[0] !== "127.0.0.1" && $scope.mongo.split(':')[0] !== "localhost")
                            $scope.mongo = "MongoDB: Remote (" + $scope.mongo + ')';
                        else
                            $scope.mongo = "MongoDB: Local (" + $scope.mongo + ')';
                        break;
                    case 'T':
                        $scope.threadNumber = e.substr(1).replace(/\.json/g, '');
                        break;
                }
            });


        }

        $scope.switchEvaluation = function () {
            $location.path('evaluations/' + $scope.evaluationName);
        };

        $scope.getEvaluations();
        $scope.evaluationName = $routeParams.evaluationName;
        $rootScope.pageTitle = ($scope.evaluationName) ? 'Evaluation results' : 'Select an evaluation';
        $scope.currentNavItem = 'nav-' + $scope.evaluationName;
        if ($scope.evaluationName)
            parseEvaluationName($scope.evaluationName);

    })
;
