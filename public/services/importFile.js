angular.module('importFileService', [])

// each function returns a promise object 
    .factory('ImportFiles', ['$http', function ($http) {
        return {
            getImportFileContent: function (filename, label, sourceMeasurementType) {
                return $http.get('/api/import/' + filename + '/' + label + '/' + sourceMeasurementType);
            },
            getImportFileNames: function () {
                return $http.get('/api/import/');
            }
        }
    }]);