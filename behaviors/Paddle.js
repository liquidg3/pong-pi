define(['altair/facades/declare',
        'liquidfire/modules/curium/behaviors/_Base'
], function (declare,
             _Base) {

    return declare([_Base], {

        player: null,

        step:  function (view, time) {


            return this.inherited(arguments);
        }

    });

});