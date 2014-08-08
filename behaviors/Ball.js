define(['altair/facades/declare',
    'liquidfire/modules/curium/behaviors/_Base'
], function (declare,
             _Base) {

    return declare([_Base], {

        startDirection: -1, //1 === right, -1 === left

        construct: function (options) {

        },

        step:  function (view, time) {


            return this.inherited(arguments);
        }

    });

});