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
            ycsbrootpath: "/home/titouan/Documents/YCSB/",
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

        socket.on('begin', function () {
            console.log("test");
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
            document.getElementById('std-container').innerHTML += data.message;
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
    }]);