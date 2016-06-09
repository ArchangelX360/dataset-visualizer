angular.module('benchmarkService', [])

	// super simple service
	// each function returns a promise object 
	.factory('Benchmarks', ['$http',function($http) {
		return {
			get: function (benchmarkName) {
				return $http.get('/api/benchmarks/' + benchmarkName);
			}/*,
			create : function(benchmarkData) {
				return $http.post('/api/benchmarks', benchmarkData);
			},
			delete : function(id) {
				return $http.delete('/api/benchmarks/' + id);
			 }*/
		}
	}]);