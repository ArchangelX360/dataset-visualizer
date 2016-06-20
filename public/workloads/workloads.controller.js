angular.module('workloadsController', [])

    .controller('WorkloadsController', function ($scope, $rootScope) {
        $rootScope.pageTitle = 'Manage Workloads';
        $scope.showHints = true;

        $scope.requestdistributions = ["uniform", "zipfian", "latest"];
        $scope.fieldlengthdistributions = ["constant", "uniform", "zipfian"];

        $scope.workloadParams = {
            workloadname: "",
            workload: "com.yahoo.ycsb.workloads.CoreWorkload",
            exporter: "com.yahoo.ycsb.measurements.exporter.TextMeasurementsExporter",
            exportfile: "outputFile",
            fieldcount: 10,
            fieldlength: 100,
            readallfields: true,
            writeallfields: false,
            fieldlengthdistribution: "constant",
            readproportion: 0.95,
            updateproportion: 0.05,
            insertproportion: 0,
            scanproportion: 0,
            readmodifywriteproportion: 0,
            requestdistribution: "uniform",
            maxscanlength: 1000,
            scanlengthdistribution: "uniform",
            insertorder: "hashed",
            operationcount: 1000,
            table: "usertable",
            recordcount: 1000
            // TODO : add missing parameters
        }

        function saveWorkload() {
            // TODO : process all parameters and request a file creation by NodeJS
        }

        function editExistingWorkload() {
            // TODO : load a workload and provide editing
        }
    });
