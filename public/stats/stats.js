angular.module('benchmarkController', ["chart.js"])
	// inject the Benchmark service factory into our controller
	.controller('BenchmarkController', ['$scope','$http','Benchmarks', function($scope, $http, Benchmarks) {
		$scope.formData = {};
		$scope.loading = true;

		// GET =====================================================================
		// when landing on the page, get all benchmarks and show them
		// use the service to get all the benchmarks
		Benchmarks.get()
			.success(function(data) {
				console.log(data);
				$scope.benchmarks = data;
				$scope.loading = false;

				$scope.labels = {};
				$scope.series = {};
				$scope.data = {};
				data.forEach(function (operationObject) {

					console.log(operationObject);
					var labels = operationObject['values'].map(function (measure) {
						return measure["time"];
					});
					var latencies = operationObject['values'].map(function (measure) {
						return measure["latency"];
					});

					$scope.labels[operationObject.operationType] = labels;
					//$scope.series = $scope.series.push(operationObject.operationType);
					$scope.series[operationObject.operationType] = [operationObject.operationType];
					$scope.data[operationObject.operationType] = [latencies];
				});
				
				$scope.onClick = function (points, evt) {
					console.log(points, evt);
				};

			});

		// CREATE ==================================================================
		// when submitting the add form, send the text to the node API
		$scope.createBenchmark = function() {

			// validate the formData to make sure that something is there
			// if form is empty, nothing will happen
			if ($scope.formData.text != undefined) {
				$scope.loading = true;

				// call the create function from our service (returns a promise object)
				Benchmarks.create($scope.formData)

					// if successful creation, call our get function to get all the new benchmarks
					.success(function(data) {
						$scope.loading = false;
						$scope.formData = {}; // clear the form so our user is ready to enter another
						$scope.benchmarks = data; // assign our new list of benchmarks
					});
			}
		};

		// DELETE ==================================================================
		// delete a benchmark after checking it
		$scope.deleteBenchmark = function(id) {
			$scope.loading = true;

			Benchmarks.delete(id)
				// if successful creation, call our get function to get all the new benchmarks
				.success(function(data) {
					$scope.loading = false;
					$scope.benchmarks = data; // assign our new list of benchmarks
				});
		};
	}]);