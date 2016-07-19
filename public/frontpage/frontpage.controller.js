angular.module('frontpageController', [])

    .controller('FrontpageController', function ($scope, $rootScope) {
        $rootScope.pageTitle = 'What do you want to do ?';
        $scope.presentation = true;

        $scope.software = false;
        $scope.visualizer = false;
        $scope.arrows = false;

        $scope.toggleSoftware = function () {
            $scope.software = !$scope.software;
        };

        $scope.toggleVisualizerApp = function () {
            $scope.visualizer = !$scope.visualizer;
        };

        $scope.toggleArrows = function () {
            $scope.arrows = !$scope.arrows;
        };

        /*
         function createPrettyJSON(num, label, measure) {
         return "{<br>"
         //+ "&nbsp;&nbsp;&nbsp;&nbsp;<span class='attribute'>num</span>: <span class='int'>" + num + "</span><br>"
         + "&nbsp;&nbsp;&nbsp;&nbsp;<span class='attribute'>label</span>: <span class='str'>" + label + "</span><br>"
         + "&nbsp;&nbsp;&nbsp;&nbsp;<span class='attribute'>measure</span>: <span class='int'>" + measure + "</span><br>"
         +"}<br>"
         }

         var i = 0;
         var zeros = document.getElementsByClassName("zero");
         for (var e of zeros) {
         e.innerHTML = createPrettyJSON(i, "INSERT", 0);
         ++i;
         }
         var fives = document.getElementsByClassName("five");
         for (var e of fives) {
         e.innerHTML = createPrettyJSON(i, "INSERT", 5);
         ++i;
         }
         var tens = document.getElementsByClassName("ten");
         for (var e of tens) {
         e.innerHTML = createPrettyJSON(i, "INSERT", 10);
         ++i;
         }
         var fifteens = document.getElementsByClassName("fifteen");
         for (var e of fifteens) {
         e.innerHTML = createPrettyJSON(i, "INSERT", 15);
         ++i;
         }
         var twenties = document.getElementsByClassName("twenty");
         for (var e of twenties) {
         e.innerHTML = createPrettyJSON(i, "INSERT", 20);
         ++i;
         }
         var twentyfives = document.getElementsByClassName("twentyfive");
         for (var e of twentyfives) {
         e.innerHTML = createPrettyJSON(i, "INSERT", 25);
         ++i;
         }*/
    });
