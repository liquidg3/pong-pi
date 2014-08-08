define(['altair/facades/declare',
        'altair/Lifecycle',
        'altair/mixins/_AssertMixin'
], function (declare,
             Lifecycle,
             _AssertMixin) {

    return declare([Lifecycle, _AssertMixin], {

        connection: null,
        side:       null,
        username:   '',
        startup: function (options) {

            var _options = options || this.options || {};

            this.connection = _options.connection;

            this.assert(this.connection, 'you must pass a socket.io connection to your user');

            return this.inherited(arguments);

        }


    });

});