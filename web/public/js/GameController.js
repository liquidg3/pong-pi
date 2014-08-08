var pongpi = angular.module('pong-pi', []);

pongpi.controller('GameController', function ($scope) {

    $scope.side         = null; //left/right
    $scope.player       = null; //user object
    $scope.username     = '';
    $scope.joined       = false;

    $scope.selectTeam = function (side) {

        //pick a side
        $scope.side = side;

        altair.sockets.emit('picked-side', {
            side: side
        });

    };

    $scope.enterUsername = function (username) {

        altair.sockets.emit('enter-username', {
            username: username
        });

        $scope.player = {
            username: username,
            side: $scope.side,
            score: 0
        };

    };

    $scope.join = function () {

        alert('joining');
        altair.sockets.emit('join');
        $scope.joined = true;
    };


});
