var pongpi = angular.module('pong-pi', []);

pongpi.controller('GameController', function ($scope) {

    $scope.side         = null; //left/right
    $scope.user         = null; //user object
    $scope.username     = '';

    $scope.selectTeam = function (side) {

        //pick a side
        $scope.side = side;

        altair.sockets.emit('picked-side', {
            side: side
        });

    };

    $scope.joinGame = function () {

        alert($scope.username);

    };


});
