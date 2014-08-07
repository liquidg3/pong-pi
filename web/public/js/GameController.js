var pongpi = angular.module('pong-pi', []);

pongpi.controller('GameController', function ($scope) {

    $scope.side = null; //left/right
    $scope.user = null; //user object
    $scope.username = null;

    $scope.selectTeam = function (side) {

        //pick a side
        $scope.side = side;

    };

    $scope.enterName = function () {



    };


});
