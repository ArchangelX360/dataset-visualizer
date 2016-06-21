angular.module('cmdController', [])
// inject the Benchmark service factory into our controller
    .controller('CmdController', ['$scope', '$rootScope', '$http', 'Cmds', 'socket', function ($scope, $rootScope, $http, Cmds, socket) {

        $rootScope.pageTitle = "Launch Benchmark";

        $scope.showHints = true;

        socket.removeAllListeners();
        $scope.$on('$destroy', function (event) {
            socket.removeAllListeners();
        });

        $scope.isFinished = true;
        $scope.isLaunched = false;

        // TODO : only timeseries are supported for now
        $scope.measurementtypes = ["timeseries"];
        // TODO : only memcached is supported for now
        $scope.dbs = ["memcached"];

        $scope.params = {
            ycsbrootpath: "/home/titouan/Documents/ycsb-web-app/ycsb-0.10.0-custom-release",
            target: "load",
            benchmarkname: "",
            status: true,
            workloadfilepath: "workloads/workloadaweb",
            db: "memcached",
            timeseries: {granularity: 1},
            pParams: {
                frontendhook: true,
                measurementtype: "timeseries",
                threadcount: 1
            }
        };

        /* FOR TESTING ONLY */
        $scope.memcachedParams = {
            memcachedrootpath: "/usr/bin/memcached",
            memcacheduser: "titouan"
        };

        socket.on('begin', function () {
            $scope.isFinished = false;
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
            $scope.isLaunched = true;
            socket.emit('authentication', $scope.params.benchmarkname,
                Cmds.post($scope.params)
                    .success(function (data) {
                        document.getElementById('std-container').innerHTML += data;
                    })
            );
        };

        $scope.startMemcached = function () {
            Cmds.startMemcached($scope.memcachedParams)
                .success(function (data) {
                    document.getElementById('std-container').innerHTML += data;
                })
        };

        $scope.killMemcached = function () {
            Cmds.killMemcached($scope.params.benchmarkname)
                .success(function (data) {
                    document.getElementById('std-container').innerHTML += data;
                })
        };
    }]);