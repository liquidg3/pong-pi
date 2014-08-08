var pongpi = angular.module('pong-pi', []);

pongpi.controller('GameController', function ($scope) {

    $scope.side         = null; //left/right
    $scope.player       = null; //user object
    $scope.username     = '';
    $scope.joined       = false;




    onScroll = function () {

        var max = $('.paddle-scroll').height() - $('.game-board').height(),
            percent = $('.game-board').scrollTop() / max;


        if ($scope.joined && max > 0) {

            altair.sockets.emit('scroll', {
                distance: percent
            });
        }


    };

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

        $scope.join();

    };

    $scope.join = function () {

        altair.sockets.emit('join');
        $scope.joined = true;


    };


});
