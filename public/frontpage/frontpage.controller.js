angular.module('frontpageController', [])

    .controller('FrontpageController', function ($scope, $rootScope) {
        $rootScope.pageTitle = 'What do you want to do ?';
    });
