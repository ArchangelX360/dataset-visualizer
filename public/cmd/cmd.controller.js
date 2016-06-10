angular.module('cmdController', ['ngMessages'])
// inject the Benchmark service factory into our controller
    .controller('CmdController', ['$scope', '$http', 'Cmds', 'socket', function ($scope, $http, Cmds, socket) {

        $scope.$on('$destroy', function (event) {
            socket.getSocket().removeAllListeners();
        });

        $scope.isLaunched = false;
        $scope.isFinished = true;

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
                measurementtype: "timeseries"
            }
        };

        socket.on('begin', function () {
            $scope.$apply(function () {
                console.log("test");
                $scope.isLaunched = true;
                $scope.isFinished = false;
            });
        });

        socket.on('stderr', function (data) {
            $scope.$apply(function () {
                document.getElementById('std-container').innerHTML += "<span class='stderr'>" + data.message + "</span>";
            });
        });

        socket.on('stdout', function (data) {
            $scope.$apply(function () {
                document.getElementById('std-container').innerHTML += "<span class='stdout'>" + data.message + "</span>";
            });
        });

        socket.on('exit', function (data) {
            $scope.$apply(function () {
                $scope.isFinished = true;
                document.getElementById('std-container').innerHTML += data.message;
            });
        });

        $scope.launchCmd = function () {
            socket.emit('authentication', $scope.params.benchmarkname);
            Cmds.post($scope.params)
                .success(function (data) {
                    document.getElementById('std-container').innerHTML += data;
                });
        };
    }]);