angular.module('cmdController', ['ngMessages'])
// inject the Benchmark service factory into our controller
    .controller('CmdController', ['$scope', '$http', 'Cmds', 'socket', function ($scope, $http, Cmds, socket) {

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

        socket.on('stderr', function (data) {
            $scope.$apply(function () {
                // TODO : find a better way to handle these variables, this is ridiculous...
                $scope.isLaunched = true;
                $scope.isFinished = false;
                document.getElementById('std-container').innerHTML += "<span class='stderr'>" + data.message + "</span>";
            });
        });

        socket.on('stdout', function (data) {
            $scope.$apply(function () {
                // TODO : find a better way to handle these variables, this is ridiculous...
                $scope.isLaunched = true;
                $scope.isFinished = false;
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
            Cmds.post($scope.params)
                .success(function (data) {
                    document.getElementById('stderr-container').innerHTML += data;
                });
        };
    }]);