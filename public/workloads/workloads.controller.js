angular.module('workloadsController', [])

    .controller('WorkloadsController', ['$scope', '$rootScope', 'Workloads', '$mdDialog', '$mdToast',
        function ($scope, $rootScope, Workloads, $mdDialog, $mdToast) {
        $rootScope.pageTitle = 'Manage Workloads';
        $scope.showHints = true;
        $scope.loading = true;

        $scope.workloads = [];
        $scope.workload = {
            filename: "",
            content: ""
        };
        $scope.selected = "";

        function createWorkload() {
            var newWorkload = {
                filename: $scope.workload.filename,
                content: $scope.workload.content
            };
            Workloads.create(newWorkload).success(function () {
                $mdToast.show(
                    $mdToast.simple()
                        .textContent('Workload ' + $scope.workload.filename + ' created.')
                        .position("top right")
                        .hideDelay(3000)
                );
                $scope.getWorkloads();
                $scope.loading = false;
            });
        }

        $scope.saveWorkload = function (ev) {
            $scope.loading = true;

            if ($scope.workloads.includes($scope.workload.filename)) {
                var confirm = $mdDialog.confirm({
                    onComplete: function afterShowAnimation() {
                        var $dialog = angular.element(document.querySelector('md-dialog'));
                        var $actionsSection = $dialog.find('md-dialog-actions');
                        var $cancelButton = $actionsSection.children()[0];
                        var $confirmButton = $actionsSection.children()[1];
                        angular.element($confirmButton).addClass('md-raised md-warn');
                        //angular.element($cancelButton).addClass('md-raised');
                    }
                })
                    .title('File already exists !')
                    .textContent('The content of the existing file will be overwritten.')
                    .ariaLabel('Are you sure')
                    .targetEvent(ev)
                    .ok('Yes')
                    .cancel('No');
                $mdDialog.show(confirm).then(function () {
                    createWorkload();
                });
            } else {
                createWorkload();
            }

        };

        $scope.deleteWorkload = function (ev) {
            $scope.loading = true;
            var confirm = $mdDialog.confirm({
                onComplete: function afterShowAnimation() {
                    var $dialog = angular.element(document.querySelector('md-dialog'));
                    var $actionsSection = $dialog.find('md-dialog-actions');
                    var $cancelButton = $actionsSection.children()[0];
                    var $confirmButton = $actionsSection.children()[1];
                    angular.element($confirmButton).addClass('md-raised md-warn');
                    //angular.element($cancelButton).addClass('md-raised');
                }
            })
                .title('Are you sure ?')
                .textContent('Deletion of a workload is not reversible once the process is complete.')
                .ariaLabel('Are you sure')
                .targetEvent(ev)
                .ok('Yes I understand the risk')
                .cancel('No');
            $mdDialog.show(confirm).then(function () {
                Workloads.delete($scope.workload.filename).success(function () {
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent('Workload ' + $scope.workload.filename + ' deleted.')
                            .position("top right")
                            .hideDelay(3000)
                    );
                    $scope.clear();
                    $scope.getWorkloads();
                    $scope.loading = false;
                });
            }, function () {
                // Do something if "no" is answered.
            });

        };

        $scope.clear = function () {
            $scope.workload.filename = "";
            $scope.workload.content = "";
        }

        $scope.loadWorkload = function () {
            Workloads.getContent($scope.selected).success(function (data) {
                // TODO : manage error
                var content = data["results"];
                $scope.workload.filename = $scope.selected;
                $scope.workload.content = content;
            });
        };

        $scope.getWorkloads = function () {
            Workloads.getNames().success(function (data) {
                var names = data["results"];
                $scope.workloads = names;
                $scope.loading = false;
            });
        }

        $scope.getWorkloads();
    }]);
