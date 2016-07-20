angular.module('evaluationService', [])
    .factory('Evaluations', ['$http', function ($http) {
        return {
            getFilenames: function () {
                return $http.get('/api/evaluations/');
            },
            getResults: function (filename) {
                return $http.get('/api/evaluations/' + filename);
            }
        }
    }]);
