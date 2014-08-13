define(['altair/facades/declare',
        './PowerUp',
        'lodash'
], function (declare,
             PowerUp,
             _) {


    return declare([PowerUp], {

        duration: 5000,
        apply: function (vc, player) {

            var side = player.side === 'left' ? 'right' : 'left',
                players = vc.players[side];
            _.each(players, function (player) {
                player.paddle.behavior.opposite = true;
            });


            setTimeout(function () {

                var players = vc.players[side];

                _.each(players, function (player) {
                    player.paddle.behavior.opposite = false;
                });

            }, this.duration);
        }

    });

});