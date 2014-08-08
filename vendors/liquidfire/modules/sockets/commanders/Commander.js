define(['altair/facades/declare',
    'altair/modules/commandcentral/mixins/_IsCommanderMixin'
], function (declare,
             _IsCommanderMixin) {

    return declare([_IsCommanderMixin], {

        /**
         * Refresh all socket startegies so schemaForCommand can drop them is as choices.
         *
         * @returns {altair.Promise}
         */
        startup: function () {
            var _args = arguments;
            return this.parent.refreshStrategies().then(this.hitch(function () { return this.inherited(_args); }));
        },

        /**
         * Startup a web server
         */
        start: function (options) {

            var named = options.strategy || this.parent.get('defaultStrategy');

            //refresh strategies
            return this.parent.refreshStrategies().then(this.hitch(function (strategies) {

                return this.forge(strategies[named], null, { startup: false });

            })).then(this.hitch(function (strategy) {

                //prompt user for schema
                return this.form(strategy.schema());

            })).then(this.hitch(function (values) {

                //start the new server
                return this.parent.startupSocket(named, values).otherwise(this.hitch('log'));

            }));

        },

        /**
         * Update schema at runtime
         *
         * @param named
         */
        schemaForCommand: function (command) {

            var schema = this.inherited(arguments),
                strategies;

            //the newModule command has some choices that need updating (destination dir)
            if(command.callback === 'start') {

                strategies = this.parent.strategies();
                schema.setOptionFor('strategy', 'choices', strategies);

            }


            return schema;
        }

    });
});