angular.module('frontpageController', [])

    .controller('FrontpageController', function ($scope, $rootScope) {
        $rootScope.pageTitle = 'What do you want to do ?';
        $scope.presentation = true;

        $scope.software = false;
        $scope.visualizer = false;
        $scope.arrows = false;

        $scope.toggleSoftware = function () {
            $scope.software = !$scope.software;
        };

        $scope.toggleVisualizerApp = function () {
            $scope.visualizer = !$scope.visualizer;
        };

        $scope.toggleArrows = function () {
            $scope.arrows = !$scope.arrows;
        };
    });
