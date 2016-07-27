angular.module('toastService', [])
    .factory('ToastService', function ($mdToast) {
        return {
            showToast: function (str, type) {
                var label = "";
                switch (type) {
                    case "accent":
                        label = "[INFO] ";
                        break;
                    case "error":
                        label = "[ERROR] ";
                        break;
                    case "success":
                        label = "[SUCCESS] ";
                        break;
                    case "warn":
                        label = "[WARNING] ";
                        break;
                }
                $mdToast.show(
                    $mdToast.simple()
                        .textContent(label + str)
                        .parent(document.querySelectorAll('#main-nav'))
                        .position("top right")
                        .hideDelay(3000)
                        .theme(type + '-toast'));
            },
            parseFsError: function (errData) {
                var message;
                if (errData.code === "ENOENT") {
                    message = 'No such file or directory ' + errData.path;
                } else if (errData.code === "ENOTDIR") {
                    message = 'Folder ' + errData.path + ' not found.';
                } else {
                    message = "See console for more information";
                    console.log(errData);
                }
                return message;
            }
        };
    });