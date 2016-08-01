angular.module('benchmarkService', [])

// each function returns a promise object 
    .factory('Benchmarks', ['$http', function ($http) {
        return {
            getByName: function (benchmarkName) {
                return $http.get('/api/benchmarks/' + benchmarkName);
            },
            getByNameByLabel: function (benchmarkName, label) {
                return $http.get('/api/benchmarks/' + benchmarkName + '/' + label);
            },
            getByNameByLabelFrom: function (benchmarkName, label, fromDateTimestamp) {
                return $http.get('/api/benchmarks/' + benchmarkName + '/' + label + '/' + fromDateTimestamp);
            },
            getByNameByLabelByQuality: function (benchmarkName, label,
                                                 fromDateTimestamp, toDateTimestamp, limit, bucketSize, seriesType) {
                return $http.get('/api/aggregate/' + benchmarkName + '/' + label + '/'
                    + fromDateTimestamp + '/' + toDateTimestamp + '/' + limit + '/' + bucketSize + '/' + seriesType);
            },
            getSize: function (benchmarkName, label) {
                return $http.get('/api/infos/benchmarks/size/' + benchmarkName + '/' + label);
            },
            getNames: function () {
                return $http.get('/nav/names');
            },
            delete: function (benchmarkName) {
                return $http.delete('/api/benchmarks/' + benchmarkName);
            },
            generateRawDBDump: function (benchmarkName) {
                return $http.get('/api/dump/' + benchmarkName);
            },
        }
    }]);