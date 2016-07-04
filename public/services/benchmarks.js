angular.module('benchmarkService', [])

// each function returns a promise object 
    .factory('Benchmarks', ['$http', function ($http) {
        return {
            getByName: function (benchmarkName) {
                return $http.get('/api/benchmarks/' + benchmarkName);
            },
            getByNameByOperationType: function (benchmarkName, operationType) {
                return $http.get('/api/benchmarks/' + benchmarkName + '/' + operationType);
            },
            getByNameByOperationTypeFrom: function (benchmarkName, operationType, fromDateTimestamp) {
                return $http.get('/api/benchmarks/' + benchmarkName + '/' + operationType + '/' + fromDateTimestamp);
            },
            getByNameByOperationTypeByQuality: function (benchmarkName, operationType, fromDateTimestamp, toDateTimestamp, limit, milliseconds) {
                return $http.get('/api/aggregate/' + benchmarkName + '/' + operationType + '/' + fromDateTimestamp + '/' + toDateTimestamp + '/' + limit + '/' + milliseconds);
            },
            getSize: function (benchmarkName, operationType) {
                return $http.get('/api/infos/benchmarks/size/' + benchmarkName + '/' + operationType);
            },
            getNames: function () {
                return $http.get('/nav/names');
            },
            delete: function (benchmarkName) {
                return $http.delete('/api/benchmarks/' + benchmarkName);
            }
        }
    }]);