angular.module('benchmarkService', [])

	// each function returns a promise object 
	.factory('Benchmarks', ['$http',function($http) {
		return {
			get: function (benchmarkName) {
				return $http.get('/api/benchmarks/' + benchmarkName);
			},
			getNames: function () {
				return $http.get('/api/benchmarks/names');
			}/*,
			create : function(benchmarkData) {
				return $http.post('/api/benchmarks', benchmarkData);
			},
			delete : function(id) {
				return $http.delete('/api/benchmarks/' + id);
			 }*/
		}
	}]);