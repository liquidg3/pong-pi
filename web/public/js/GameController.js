var pongpi = angular.module('pong-pi', []);

pongpi.controller('GameController', function ($scope) {

    $scope.side         = null; //left/right
    $scope.player       = null; //user object
    $scope.username     = '';
    $scope.joined       = false;
    $scope.colors       = ['#dfd9b5', '#a4897e', '#ff625d', '#00525e', '#1a303b', '#5a3735'];

    altair.sockets.on('score', function (e) {

        $scope.player.score += e.get('points');
        $scope.$apply();

    });


    onScroll = function () {

        var max     = $('.paddle-scroll').height() - $('.game-board').height(),
            percent = $('.game-board').scrollTop() / max;

        console.log('max', max, percent);

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
            score: 0,
            color: false
        };

        alert('pick a color');

    };

    $scope.selectColor = function (color) {

        $scope.player.color = color;

        altair.sockets.emit('color', {
            color: color
        });

        this.join();
    };

    $scope.join = function () {

        altair.sockets.emit('join');
        $scope.joined = true;

        var max     = $('.paddle-scroll').height() - $('.game-board').height();

        $('.game-board').scrollTop(max / 2);


    };


});
