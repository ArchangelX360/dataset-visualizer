var app = angular.module('visualisationYCSB', [
    'ngAnimate',
    'ngRoute',
    'ngMaterial',
    'benchmarkController',
    'frontpageController',
    'benchmarkService'
]);

app.config(function($routeProvider) {
    $routeProvider.when('/', {templateUrl: 'frontpage/frontpage.html', controller:''})
        .when('/stats', {templateUrl: 'stats/stats.html', controller:'BenchmarkController'});
});

app.run(function($rootScope, $location){
    $rootScope.classView = 'view';
});

