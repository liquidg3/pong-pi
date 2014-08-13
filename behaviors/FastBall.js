define(['altair/facades/declare',
        './PowerUp',
        'lodash'
], function (declare,
             PowerUp,
             _) {


    return declare([PowerUp], {

        duration: 7000,
        apply: function (vc, player) {

            _.each(vc.balls, function (ball) {
                ball.behavior.velocity.speed = vc.ballSpeed * 2;
            });

            setTimeout(function () {

                _.each(vc.balls, function (ball) {
                    ball.behavior.velocity.speed = vc.ballSpeed;
                });

            }, this.duration);
        }

    });

});