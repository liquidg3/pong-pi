define(['altair/facades/declare',
    './PowerUp'
], function (declare,
             PowerUp) {


    return declare([PowerUp], {

        apply: function (vc, player) {

            player.paddle.frame.height *= 2;

            setTimeout(function () {

                player.paddle.frame.height /= 2;

            }, 5000);

        }


    });

});