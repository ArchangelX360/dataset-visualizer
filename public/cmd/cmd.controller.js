angular.module('cmdController', [])
// inject the Benchmark service factory into our controller
    .controller('CmdController', ['$scope', '$rootScope', '$http', 'Cmds', 'socket', 'Workloads', 'Databases', 'ToastService',
        function ($scope, $rootScope, $http, Cmds, socket, Workloads, Databases, ToastService) {

            /* Socket reinitialisation */
            socket.removeAllListeners();
            $scope.$on('$destroy', function (event) {
                socket.removeAllListeners();
            });

            /* Variables initialisation */
            $rootScope.pageTitle = "Launch Benchmark";

            $scope.isFinished = true;
            $scope.hasBeenLaunched = false;
            $scope.showHints = true;
            $scope.workloads = [];
            $scope.dbs = [];
            $scope.measurementtypes = [
                "frontend",
                "histogram",
                "hdrhistogram",
                "hdrhistogram+histogram",
                "hdrhistogram+raw",
                "timeseries",
                "raw"
            ];
            $scope.params = {
                target: "load",
                benchmarkname: "",
                status: true,
                workloadfile: "",
                db: "memcached",
                pParams: {
                    measurementtype: "",
                    threadcount: 1
                }
            };

            /* Function definitions */

            function appendConsole(string) {
                var console = document.getElementById('std-container');
                var container = document.getElementsByClassName('console-container') [0];
                console.innerHTML += string;
                container.scrollTop = container.scrollHeight;
            }

            function getDatabases() {
                $scope.loading = true;
                Databases.get().then(function (result) {
                    $scope.dbs = result.data;
                    $scope.loading = false;
                }, function (err) {
                    if (err.data.hasOwnProperty('code')) {
                        ToastService.showToast(ToastService.parseFsError(err.data), 'error');
                    } else {
                        ToastService.showToast(err.data, 'error');
                    }
                });
            }

            /* Socket listeners */

            socket.on('begin', function () {
                $scope.isFinished = false;
                $scope.hasBeenLaunched = true;
            });

            socket.on('stderr', function (data) {
                appendConsole("<span class='stderr'>" + data.message + "</span>");
            });

            socket.on('stdout', function (data) {
                appendConsole("<span class='stdout'>" + data.message + "</span>");
            });

            socket.on('exit', function (data) {
                $scope.isFinished = true;
                ToastService.showToast("Benchmark done!", 'accent');
                appendConsole("<span class='exit'>" + data.message + "</span>");
            });

            /* Scope functions */

            $scope.launchCmd = function () {
                socket.emit('authentication', $scope.params.benchmarkname,
                    Cmds.post($scope.params)
                        .then(function (result) {
                            ToastService.showToast(result.data, 'accent');
                        }, function (err) {
                            ToastService.showToast(err.data, 'error');
                        })
                );
            };

            $scope.killBenchmark = function () {
                socket.emit('kill');
                ToastService.showToast("Benchmark killed.", 'warn');
            };

            $scope.clearConsole = function () {
                var console = document.getElementById('std-container');
                var container = document.getElementsByClassName('console-container')[0];
                console.innerHTML = "";
                container.scrollTop = container.scrollHeight;
            };

            $scope.startMemcached = function () {
                Cmds.startMemcached()
                    .then(function (result) {
                        ToastService.showToast(result.data, 'accent');
                    }, function (err) {
                        ToastService.showToast(err.data, 'error');
                    })
            };

            $scope.killMemcached = function () {
                Cmds.killMemcached()
                    .then(function (result) {
                        ToastService.showToast(result.data, 'warn');
                    }, function (err) {
                        ToastService.showToast(err.data, 'error');
                    })
            };


            $scope.getWorkloads = function () {
                $scope.loading = true;
                Workloads.getNames().then(function (result) {
                    var names = result.data;
                    $scope.workloads = names;
                    $scope.params.workloadfile = names[0];
                    $scope.getMeasurementType();
                    $scope.loading = false;
                }, function (err) {
                    if (err.data.hasOwnProperty('code')) {
                        ToastService.showToast(ToastService.parseFsError(err.data), 'error');
                    } else {
                        ToastService.showToast(err.data, 'error');
                    }
                });
            };

            $scope.getMeasurementType = function () {
                Workloads.getContent($scope.params.workloadfile).then(function (result) {
                    var content = result.data;
                    var contentArray = content.match(/[^\r\n]+/g);
                    var found = false;
                    contentArray.forEach(function (line) {
                        var myRegexp = /^measurementtype=([a-zA-Z0-9]*)/;
                        var exec = myRegexp.exec(line);
                        if (exec) {
                            found = true;
                            $scope.params.pParams.measurementtype = exec[1];
                        }
                    });
                    if (!found) {
                        $scope.params.pParams.measurementtype = "frontend";
                    }
                }, function (err) {
                    if (err.data.hasOwnProperty('code')) {
                        ToastService.showToast(ToastService.parseFsError(err.data), 'error');
                    } else {
                        ToastService.showToast(err.data, 'error');
                    }
                });
            };

            /* Initialisation */

            getDatabases();
            $scope.getWorkloads();
        }]);