angular.module('frontpageController', [])

    .controller('FrontpageController', function ($scope, $rootScope) {
        $rootScope.pageTitle = 'What do you want to do ?';
        $scope.presentation = true;

        $scope.ycsb = false;
        $scope.visualizer = false;

        $scope.toggleYCSB = function () {
            $scope.ycsb = !$scope.ycsb;
        };

        $scope.toggleVisualizerApp = function () {
            $scope.visualizer = !$scope.visualizer;
        };
    });
