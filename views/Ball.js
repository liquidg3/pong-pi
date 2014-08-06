define(['altair/facades/declare',
        'altair/Lifecycle',
        'liquidfire/modules/curium/views/Circle'
], function (declare,
             Lifecycle,
             View) {

    return declare([View, Lifecycle], {

        render: function (context) {

            this.inherited(arguments);


        }

    });

});