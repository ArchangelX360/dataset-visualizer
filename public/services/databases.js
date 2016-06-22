angular.module('databasesService', [])

// super simple service
// each function returns a promise object 
    .factory('Databases', ['$http', function ($http) {
        return {
            get: function () {
                return $http.get('/api/databases');
            }
        }
    }]);