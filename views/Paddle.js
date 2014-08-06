define(['altair/facades/declare',
        'altair/Lifecycle',
        'liquidfire/modules/curium/views/View'
], function (declare,
             Lifecycle,
             View) {

    return declare([View, Lifecycle], {

        render: function (context) {

            this.inherited(arguments);


        }

    });

});