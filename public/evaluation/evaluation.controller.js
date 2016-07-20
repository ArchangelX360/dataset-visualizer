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
    .controller('EvaluationController', function ($scope, $rootScope, $routeParams, Evaluations, ToastService) {
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

                    chart.addSeries({
                        name: 'Frontend',
                        data: frontendData
                    });

                    chart.addSeries({
                        name: 'Raw',
                        data: rawData
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

        $scope.getEvaluations();
        $scope.evaluationName = $routeParams.evaluationName;
        $rootScope.pageTitle = ($scope.evaluationName) ? 'Evaluation results' : 'Select an evaluation';
        $scope.currentNavItem = 'nav-' + $scope.evaluationName;

    })
;
