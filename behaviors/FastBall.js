define(['altair/facades/declare',
        './PowerUp'
], function (declare,
             PowerUp) {


    return declare([PowerUp], {


        apply: function (vc, player) {

            _.each(vc.balls, function (ball) {
                ball.velocity.speed *= 2;
            });

            setTimeout(function () {

                _.each(vc.balls, function (ball) {
                    ball.velocity.speed /= 2;
                });

            }, 5000);
        }

    });

});