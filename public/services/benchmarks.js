angular.module('benchmarkService', [])

	// each function returns a promise object 
	.factory('Benchmarks', ['$http',function($http) {
		return {
			getByName: function (benchmarkName) {
				return $http.get('/api/benchmarks/' + benchmarkName);
			},
			getByNameByOperationType: function (benchmarkName, operationType) {
				return $http.get('/api/benchmarks/' + benchmarkName + '/' + operationType);
			},
			/*getByNameMapByOperationType : function(benchmarkName, operationArray) {
			 return $http.post('/api/benchmarks', {
			 benchmark_name: benchmarkName,
			 operation_array : JSON.stringify(operationArray)
			 });
			 },*/
			getByNameByOperationTypeByFromDate: function (benchmarkName, operationType, fromDateTimestamp) {
				return $http.get('/api/benchmarks/' + benchmarkName + '/' + operationType + '/' + fromDateTimestamp);
			},
			getNames: function () {
				return $http.get('/api/benchmarks/names');
			}
		}
	}]);


/*,
 create : function(benchmarkData) {
 return $http.post('/api/benchmarks', benchmarkData);
 },
 delete : function(id) {
 return $http.delete('/api/benchmarks/' + id);
 }*/