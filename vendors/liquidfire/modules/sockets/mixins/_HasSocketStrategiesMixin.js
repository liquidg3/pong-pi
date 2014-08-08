define(['altair/facades/declare',
    'altair/Lifecycle',
    'lodash',
    'altair/events/Emitter'
], function (declare,
             Lifecycle,
             _,
             Emitter) {


    return declare([Lifecycle, Emitter], {

        startup: function () {

            this.on('liquidfire:Sockets::register-socket-strategies').then(this.hitch('registerSocketStrategies'));

            return this.inherited(arguments);
        },

        /**
         * Report back our socket strategies. we do not instantiate them
         *
         * @param e
         * @returns {*|Promise}
         */
        registerSocketStrategies: function (e) {

            return this.parseConfig('configs/socket-strategies').then(this.hitch(function (strategies) {

                _.each(strategies, function (strategy, index, strategies) {
                    if(strategy.search(':') === -1) {
                        strategies[index] = this.name + '/' + strategy;
                    }
                }, this);

                return strategies;

            })).otherwise(this.hitch(function (err) {
                this.log(err);
                this.log(new Error('You must create a valid ' + this.dir + '/configs/socket-strategies for _HasSocketStrategiesMixin to work ' + this));
            }));

        }

    });

});
