var app = angular.module('visualisationYCSB', [
    'btford.socket-io',
    'ngAnimate',
    'ngAria',
    'ngRoute',
    'ngMaterial',
    'benchmarkController',
    'cmdController',
    'frontpageController',
    'benchmarkService',
    'cmdService'
]);

app.config(function($routeProvider) {
    $routeProvider.when('/', {templateUrl: 'frontpage/frontpage.html', controller:''})
        .when('/stats/:benchmarkName', {templateUrl: 'stats/stats.html', controller: 'BenchmarkController'})
        .when('/cmd', {templateUrl: 'cmd/cmd.html', controller: 'CmdController'})
    ;
});

app.factory('socket', ['$rootScope', function ($rootScope) {
    var socket = io.connect();

    return {
        on: function (eventName, callback) {
            socket.on(eventName, callback);
        },
        emit: function (eventName, data) {
            socket.emit(eventName, data);
        }
    };
}]);

app.run(function($rootScope, $location){
    $rootScope.classView = 'view';
});

