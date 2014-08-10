define(['altair/facades/declare',
        'liquidfire/modules/curium/behaviors/_Base'
    ], function (declare,
             _Base) {


    return declare([_Base], {


        //@todo: emit an event every time a ball hits me.
        //then maybe we could extend the block view, and create some more complex events like ... 'when hit by ball x number of times, provide <powerup> to all players, or last player to hit the ball.
    });

});