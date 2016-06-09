angular.module('cmdService', [])

// super simple service
// each function returns a promise object 
    .factory('Cmds', ['$http', function ($http) {
        return {
            post: function (params) {
                return $http.post('/cmd/launch', params);
            }
        }
    }]);