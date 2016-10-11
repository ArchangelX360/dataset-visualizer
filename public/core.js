var app = angular.module('visualisationYCSB', [
    'ngMaterial',
    'ngAria',
    'ngRoute',
    'ngMessages',
    'ngAnimate',
    'cmdController',
    'frontpageController',
    'workloadsController',
    'evaluationController',
    'benchmarkService',
    'importFileService',
    'workloadService',
    'databasesService',
    'toastService',
    'cmdService',
    'evaluationService',
    'stats',
    'btford.socket-io'
]);

app.config(function ($mdThemingProvider) {
    $mdThemingProvider.theme("accent-toast");
    $mdThemingProvider.theme("error-toast");
    $mdThemingProvider.theme("warn-toast");
    $mdThemingProvider.theme("success-toast");
    $mdThemingProvider.theme('default')
        .primaryPalette('green')
        .accentPalette('blue')
        .warnPalette('orange')
    //.dark()
    ;
});

app.config(function ($routeProvider) {
    $routeProvider.when('/', {templateUrl: 'frontpage/frontpage.html', controller: 'FrontpageController'})
        .when('/stats/:benchmarkName?/:fileParser?', {templateUrl: 'stats/stats.html', controller: 'StatController'})
        .when('/cmd', {templateUrl: 'cmd/cmd.html', controller: 'CmdController'})
        .when('/workloads', {templateUrl: 'workloads/workloads.html', controller: 'WorkloadsController'});
});

app.factory('socket', function (socketFactory) {
    return socketFactory();
});

app.filter('evaluationsanitize', function () {
    return function (input) {
        return input.replace(/\.json|results\-/g, '');
    };
});

app.run(function ($rootScope) {
    $rootScope.classView = 'view';
    $rootScope.pageTitle = '';
});

