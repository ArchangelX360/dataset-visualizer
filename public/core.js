var app = angular.module('visualisationYCSB', [
    'ngMaterial',
    'ngAria',
    'ngRoute',
    'ngMessages',
    'ngAnimate',
    'benchmarkController',
    'cmdController',
    'frontpageController',
    'workloadsController',
    'benchmarkService',
    'workloadService',
    'databasesService',
    'cmdService',
    'stats',
    'btford.socket-io'
]);

app.config(function($routeProvider) {
    $routeProvider.when('/', {templateUrl: 'frontpage/frontpage.html', controller: 'FrontpageController'})
        .when('/stats/:benchmarkName', {templateUrl: 'stats/stats.html', controller: 'BenchmarkController'})
        .when('/stats-custom/:benchmarkName',
            {templateUrl: 'stats/stats-custom-hng.html', controller: 'StatController'})
        .when('/stats', {templateUrl: 'stats/list.html', controller: 'BenchmarkListController'})
        .when('/cmd', {templateUrl: 'cmd/cmd.html', controller: 'CmdController'})
        .when('/workloads', {templateUrl: 'workloads/workloads.html', controller: 'WorkloadsController'})
    ;
});

app.factory('socket', function (socketFactory) {
    return socketFactory();
});

app.run(function ($rootScope) {
    $rootScope.classView = 'view';
    $rootScope.pageTitle = '';
});

