angular.module('cmdController', [])
// inject the Benchmark service factory into our controller
    .controller('CmdController', ['$scope', '$rootScope', '$http', 'Cmds', 'socket', 'Workloads', function ($scope, $rootScope, $http, Cmds, socket, Workloads) {

        $rootScope.pageTitle = "Launch Benchmark";

        $scope.showHints = true;
        $scope.workloads = [];

        socket.removeAllListeners();
        $scope.$on('$destroy', function (event) {
            socket.removeAllListeners();
        });

        $scope.isFinished = true;
        $scope.isLaunched = false;

        $scope.measurementtypes = [
            "frontend",
            "histogram",
            "hdrhistogram",
            "hdrhistogram+histogram",
            "hdrhistogram+raw",
            "timeseries",
            "raw"
        ];
        // TODO : add histogram and stuff parameters ?

        // TODO : only memcached is supported for now
        $scope.dbs = ["memcached"];

        $scope.params = {
            target: "load",
            benchmarkname: "",
            status: true,
            workloadfile: "workloadaweb",
            db: "memcached",
            timeseries: {granularity: 1},
            pParams: {
                measurementtype: "frontend",
                threadcount: 1
            }
        };

        socket.on('begin', function () {
            $scope.isFinished = false;
            $scope.isLaunched = true;
        });

        socket.on('stderr', function (data) {
            document.getElementById('std-container').innerHTML += "<span class='stderr'>" + data.message + "</span>";
        });

        socket.on('stdout', function (data) {
            document.getElementById('std-container').innerHTML += "<span class='stdout'>" + data.message + "</span>";
        });

        socket.on('exit', function (data) {
            $scope.isFinished = true;
            document.getElementById('std-container').innerHTML += "<span class='exit'>" + data.message + "</span>";
        });

        $scope.launchCmd = function () {
            socket.emit('authentication', $scope.params.benchmarkname,
                Cmds.post($scope.params)
                    .success(function (data) {
                        document.getElementById('std-container').innerHTML += data;
                    })
            );
        };

        $scope.clearConsole = function () {
            document.getElementById('std-container').innerHTML = "";
        };

        $scope.startMemcached = function () {
            Cmds.startMemcached()
                .success(function (data) {
                    document.getElementById('std-container').innerHTML += data;
                })
        };

        $scope.killMemcached = function () {
            Cmds.killMemcached()
                .success(function (data) {
                    document.getElementById('std-container').innerHTML += data;
                })
        };

        $scope.getWorkloads = function getWorkloads() {
            Workloads.getNames().success(function (names) {
                $scope.workloads = names;
                $scope.loading = false;
            });
        };

        $scope.getWorkloads();
    }]);