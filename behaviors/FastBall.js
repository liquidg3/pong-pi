define(['altair/facades/declare',
        './PowerUp'
], function (declare,
             PowerUp) {


    return declare([PowerUp], {


        duration: 5000,
        apply: function (vc, player) {

            _.each(vc.balls, function (ball) {
                ball.behavior.velocity.speed *= 2;
            });

            setTimeout(function () {

                _.each(vc.balls, function (ball) {
                    ball.behavior.velocity.speed /= 2;
                });

            }, this.duration);
        }

    });

});