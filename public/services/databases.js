angular.module('databasesService', [])
    .factory('Databases', ['$http', function ($http) {
        return {
            get: function () {
                return $http.get('/api/databases');
            }
        }
    }]);