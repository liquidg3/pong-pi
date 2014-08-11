define(['altair/facades/declare',
    './PowerUp'
], function (declare,
             PowerUp) {


    return declare([PowerUp], {

        duration: 10000,
        apply: function (vc, player) {

            player.paddle.frame.height *= 2;

            setTimeout(function () {

                player.paddle.frame.height /= 2;

            }, this.duration);

        }


    });

});