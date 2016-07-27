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

        /**
         * Parse an evaluation name to get pretty information to display
         *
         * @param name the evaluation filename
         */
        function parseEvaluationName(name) {
            $scope.infos = {};
            var array = name.split('-');
            array.forEach(function (e) {
                switch (e[0]) {
                    case 'I':
                        $scope.infos.iterationNumber = e.substr(1).replace(/\.json/g, '');
                        break;
                    case 'W':
                        $scope.infos.workload = e.substr(1).replace(/\.json/g, '');
                        break;
                    case 'M':
                        $scope.infos.memcachedAddress = e.substr(1).replace(/\.json/g, '');
                        if ($scope.infos.memcachedAddress.split(':')[0] !== "127.0.0.1" && $scope.infos.memcachedAddress.split(':')[0] !== "localhost")
                            $scope.infos.memcachedAddress = "Memcached: Remote (" + $scope.infos.memcachedAddress + ')';
                        else
                            $scope.infos.memcachedAddress = "Memcached: Local (" + $scope.infos.memcachedAddress + ')';
                        break;
                    case 'S':
                        $scope.infos.mongo = e.substr(1).replace(/\.json/g, '');
                        if ($scope.infos.mongo.split(':')[0] !== "127.0.0.1" && $scope.infos.mongo.split(':')[0] !== "localhost")
                            $scope.infos.mongo = "MongoDB: Remote (" + $scope.infos.mongo + ')';
                        else
                            $scope.infos.mongo = "MongoDB: Local (" + $scope.infos.mongo + ')';
                        break;
                    case 'T':
                        $scope.infos.threadNumber = e.substr(1).replace(/\.json/g, '');
                        break;
                }
            });


        }

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

        $scope.switchEvaluation = function () {
            $location.path('evaluations/' + $scope.evaluationName);
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

        $scope.loading = true;
        $scope.getEvaluations();
        $scope.evaluationName = $routeParams.evaluationName;
        $rootScope.pageTitle = ($scope.evaluationName) ? 'Evaluation results' : 'Select an evaluation';
        $scope.currentNavItem = 'nav-' + $scope.evaluationName;
        if ($scope.evaluationName)
            parseEvaluationName($scope.evaluationName);

    })
    .directive('hcComparaisonChart', function () {
        return {
            restrict: 'E',
            template: '<div></div>',
            scope: {
                title: '@',
                initfunc: '=',
                type: '@',
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
                        events: {
                            load: function () {
                                var chart = this;
                                scope.initfunc(chart, scope.type);
                            }
                        }
                    },
                    title: {
                        text: scope.title
                    },
                    yAxis: {
                        title: {
                            text: "Efficiency (%)"
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
    .controller('CrossEvaluationController', function ($scope, $rootScope, $routeParams, $mdSidenav, $location, Evaluations, ToastService) {

        /**
         * Sort a workload filenames array by number of points with the following format:
         * <letter_of_workload><number_of_points>k
         *
         * NOTE: this is a very specific function, you might want to override it
         *
         * @param a one workload filename
         * @param b another workload filename
         * @returns {number}
         */
        function sortWorkloadFilenames(a, b) {
            return parseInt(a.substr(1).split('k')[0]) - parseInt(b.substr(1).split('k')[0]);
        }

        /**
         * Initialize a comparaison chart
         *
         * @param chart the highcharts object
         * @param highchartsCategories the x-axis categories
         * @param highchartsData the y-axis data (ordered the same way as categories)
         */
        function initComparaisonChart(chart, highchartsCategories, highchartsData) {
            if ($scope.fixedScale) {
                chart.yAxis[0].setExtremes(-100, 100, true);
            }
            chart.xAxis[0].setCategories(highchartsCategories);
            chart.addSeries({
                type: "column",
                showInLegend: false,
                data: highchartsData
            });
            $scope.loading = false;
        }

        /**
         * Returns if the view is in chart generation mode (all parameter variables are set)
         *
         * @param params parameters object
         * @returns {boolean} true if all parameter variables are set, false otherwise
         */
        function isGenerationMode(params) {
            return (params.iterationNumber.selectedValues.length > 0) &&
                (params.mongoUri.selectedValues.length > 0) &&
                (params.memcachedUri.selectedValues.length > 0) &&
                (params.threadNumber.selectedValues.length > 0) &&
                (params.workloads.selectedValues.length > 0);
        }

        /**
         * Return if the parameter with the specified name is a fixed parameter
         * @param name the name of the parameter we want to check
         * @returns {boolean} true if the parameter with the specified name is a fixed parameter, false otherwise
         */
        function isParamFixed(name) {
            return $scope.notFixedParameter !== name;
        }

        /**
         * Return the correct selected value based on the "fixed" state of the parameter
         *
         * @param parameter the parameter object
         * @returns {Array|*}
         */
        function getSelectedValues(parameter) {
            return (parameter.isFixed()) ? parameter.selectedValues[0] : parameter.selectedValues;
        }

        /**
         * Initialize the controller by initializing all settings
         */
        function initController() {
            $scope.notFixedParameter = $routeParams.notFixedParameter;

            Evaluations.getInfos().then(function (response) {
                var availableParameters = response.data;

                $scope.params = {
                    iterationNumber: {
                        id: "iteration-number",
                        name: "iterationNumber",
                        selectStr: "Select an iteration number",
                        filenameLetter: "I",
                        collection: availableParameters.I,
                        selectedValues: [],
                        isFixed: function () {
                            return isParamFixed("iterationNumber")
                        }
                    },
                    mongoUri: {
                        id: "mongo-uri",
                        name: "mongoUri",
                        selectStr: "Select a MongoDB URI",
                        filenameLetter: "S",
                        collection: availableParameters.S,
                        selectedValues: [],
                        isFixed: function () {
                            return isParamFixed("mongoUri")
                        }
                    },
                    memcachedUri: {
                        id: "memcached-uri",
                        name: "memcachedUri",
                        selectStr: "Select a Memcached URI",
                        filenameLetter: "M",
                        collection: availableParameters.M,
                        selectedValues: [],
                        isFixed: function () {
                            return isParamFixed("memcachedUri")
                        }
                    },
                    threadNumber: {
                        id: "thread-number",
                        name: "threadNumber",
                        selectStr: "Select a thread number",
                        filenameLetter: "T",
                        collection: availableParameters.T,
                        selectedValues: [],
                        isFixed: function () {
                            return isParamFixed("threadNumber")
                        }
                    },
                    workloads: {
                        id: "workloads",
                        name: "workloads",
                        selectStr: "Select a workload",
                        filenameLetter: "W",
                        collection: availableParameters.W.sort(sortWorkloadFilenames),
                        selectedValues: [],
                        isFixed: function () {
                            return isParamFixed("workloads")
                        }
                    }
                };

                if (Object.keys($routeParams).length >= 5) {
                    for (var parameter in $routeParams) {
                        if ($routeParams.hasOwnProperty(parameter))
                            if ($scope.params.hasOwnProperty(parameter)) {
                                $scope.params[parameter].selectedValues = [];
                                $scope.params[parameter].selectedValues = $routeParams[parameter].split(',');
                                if (parameter === "workloads") {
                                    $scope.params[parameter].selectedValues.sort(sortWorkloadFilenames)
                                }
                            }
                    }
                }

                $scope.generationMode = isGenerationMode($scope.params);
                $scope.loading = false;
            });

        }

        /**
         * Returns the specific filename corresponding to the fixed parameter specified
         *
         * @param fixedParamFilenameLetter the filename letter ID of the fixed parameter
         * @param fixedValue the fixed parameter value
         * @returns {string} the specific filename corresponding to the fixed parameter specified
         */
        function getSpecificFilename(fixedParamFilenameLetter, fixedValue) {
            var replaceFixedRegex = new RegExp("(" + fixedParamFilenameLetter + ")(.*?)(-)", "");
            var filename = "I" + $scope.params.iterationNumber.selectedValues
                + "-W" + $scope.params.workloads.selectedValues
                + "-M" + $scope.params.memcachedUri.selectedValues
                + "-T" + $scope.params.threadNumber.selectedValues
                + "-S" + $scope.params.mongoUri.selectedValues
                + "-";

            filename = filename.replace(replaceFixedRegex, "$1" + fixedValue + "$3");
            filename = filename.substr(0, filename.length - 1) + ".json";
            return filename;
        }

        $scope.toggle = function (item, list) {
            var idx = list.indexOf(item);
            if (idx > -1) {
                list.splice(idx, 1);
            }
            else {
                list.push(item);
            }
        };

        $scope.exists = function (item, list) {
            return list.indexOf(item) > -1;
        };

        $scope.generateComparaison = function () {
            if (isGenerationMode($scope.params)) {
                $location.path('cross-evaluations/'
                    + $scope.notFixedParameter
                    + '/' + getSelectedValues($scope.params.iterationNumber)
                    + '/' + getSelectedValues($scope.params.mongoUri)
                    + '/' + getSelectedValues($scope.params.memcachedUri)
                    + '/' + getSelectedValues($scope.params.threadNumber)
                    + '/' + getSelectedValues($scope.params.workloads));
            } else {
                ToastService.showToast("Please select missing parameters", "error");
            }
        };

        $scope.initComparaisonChartRoutine = function (chart, type) {
            $scope.loading = true;
            var highchartsCategories = [];
            var highchartsDataMap = {};
            var fixedParamFilenameLetter = "";

            // Getting the non-fixed parameter
            for (var parameter in $scope.params) {
                if ($scope.params.hasOwnProperty(parameter)) {
                    if (!$scope.params[parameter].isFixed()) {
                        highchartsCategories = $scope.params[parameter].selectedValues;
                        fixedParamFilenameLetter = $scope.params[parameter].filenameLetter;
                    }
                }
            }

            // For all different value of the non-fixed parameter
            highchartsCategories.forEach(function (fixedValue) {
                var filename = getSpecificFilename(fixedParamFilenameLetter, fixedValue);

                Evaluations.getResults(filename).then(function (response) {
                        highchartsDataMap[fixedValue] = response.data.results["percents"][type] - 100;

                        // When we iterated all values of the non-fixed parameters
                        if (Object.keys(highchartsDataMap).length >= highchartsCategories.length) {

                            // Re-ordering the values to match the categories due to the async fetch
                            var highchartsData = [];
                            for (var category in highchartsDataMap) {
                                if (highchartsDataMap.hasOwnProperty(category))
                                    highchartsData[highchartsCategories.indexOf(category)] = highchartsDataMap[category];
                            }

                            // We launch the chart creation
                            initComparaisonChart(chart, highchartsCategories, highchartsData);
                        }
                    },
                    function (err) {
                        ToastService.showToast(err.data, "error");
                    }
                );
            });
        };

        $scope.loading = true;
        $scope.fixedScale = true;
        $rootScope.pageTitle = "Select a parameter you want to compare";
        initController();
    });
