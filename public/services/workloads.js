angular.module('workloadService', [])

// each function returns a promise object 
    .factory('Workloads', ['$http', function ($http) {
        return {
            getNames: function () {
                return $http.get('/api/workloads/');
            },
            getContent: function (filename) {
                return $http.get('/api/workloads/' + filename);
            },
            create: function (workload) {
                return $http.post('/api/workloads/', workload);
            },
            delete: function (filename) {
                return $http.delete('/api/workloads/' + filename);
            }
        }
    }]);

