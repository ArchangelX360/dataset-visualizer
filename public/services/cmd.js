angular.module('cmdService', [])

// super simple service
// each function returns a promise object 
    .factory('Cmds', ['$http', function ($http) {
        return {
            post: function (params) {
                return $http.post('/cmd/launch', params);
            },
            startMemcached: function (params) {
                return $http.post('/cmd/memcached/', params);
            },
            killMemcached: function () {
                return $http.delete('/cmd/memcached/');
            }
        }
    }]);