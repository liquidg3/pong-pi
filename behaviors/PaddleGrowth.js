define(['altair/facades/declare',
    './PowerUp'
], function (declare,
             PowerUp) {


    return declare([PowerUp], {

        duration: 10000,
        apply: function (vc, player) {

            player.paddle.animate('frame.height', vc.paddleHeight * 2, 1000);

            setTimeout(function () {

                player.paddle.animate('frame.height', vc.paddleHeight, 1000);

            }, this.duration);

        }


    });

});