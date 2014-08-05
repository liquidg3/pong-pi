define(['altair/facades/declare',
        'liquidfire/modules/curium/models/App'
], function (declare,
             App) {

    return declare([App], {

        startup: function () {

            return this.inherited(arguments);
        }

    });

});