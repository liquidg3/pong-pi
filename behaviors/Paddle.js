define(['altair/facades/declare',
        'liquidfire/modules/curium/behaviors/_Base'
], function (declare,
             _Base) {

    return declare([_Base], {

        player: null,
        top:    0,
        constructor: function (options) {

            this.assert(options && options.player, 'you must pass options and a player');

            options.player.connection.on('scroll', this.hitch('onScroll'));

        },

        step:  function (time) {
            this.view.frame.top = this.top;

            return this.inherited(arguments);
        },

        onScroll: function (data) {
            var max = this.vc.view.frame.height - this.view.frame.height;
            this.top =  max - data.distance * max;
        }

    });

});