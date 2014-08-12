/**
 * Bridges the event gap between front and back end.
 *
 * @author:     Taylor
 * @license:    MIT
 * @vendor:     liquidfire
 * @module:     Sockets
 * @nexus:      this.nexus("liquidfire:Sockets")
 *
 */

define(['altair/facades/declare',
        'altair/modules/commandcentral/mixins/_HasCommandersMixin',
        './mixins/_HasSocketStrategiesMixin',
        'lodash'
], function (declare,
             _HasCommandersMixin,
             _HasSocketStrategiesMixin,
             _) {

    return declare([_HasCommandersMixin, _HasSocketStrategiesMixin], {

        _strategies: null,
        _activeSockets: null,

        /*
         * @param options
         * @returns {altair.Promise}
         */
        startup: function (options) {

            //use the options that were passed in, or the ones we have by default; avoid mutating options
            var _options = options || this.options || {};

            //reset active servers
            this._activeSockets = [];

            //whenever a web server is booted, make sure each strategy is notified so it can copy css/js if needed
            if (this.nexus('titan:Alfred')) {
                this.on('titan:Alfred::did-execute-server').then(this.hitch('onDidExecuteAlfredWebServer'));
            }

            //let any mixin run their startup
            return this.inherited(arguments);

        },

        /**
         * Module is being executed, by waiting until now to check our options for sockets is so all other modules
         * have had a chance to start up
         *
         * @returns {*|Promise}
         */
        execute: function () {

            return this.inherited(arguments).then(this.hitch(function () {

                var options = this.options || {};

                //did someone pass some sockets through?
                if (options.sockets) {

                    //loop through each and start them up
                    _.each(options.sockets, function (socket) {

                        this.startupSocket(socket.name, socket.options).otherwise(this.hitch('log'));

                    }, this);

                }

                return this;

            }));

        },

        /**
         * Make sure the sockets get a chance to configure the alfred web server (this will only do anything if socket
         * is started before alfred).
         *
         * @param e {altair.events.Emitter}
         */
        onDidExecuteAlfredWebServer: function (e) {

            _.each(this._activeSockets, function (server) {
                server.configureWebServer(e.get('server'));
            });

        },

        /**
         * All the socket server strategies we have available
         *
         * @returns {altair.Deferred}
         */
        refreshStrategies: function () {

            return this.emit('register-socket-strategies').then(this.hitch(function (e) {

                var _strategies = {};

                _.each(e.results(), function (obj) {
                    _.merge(_strategies, obj);
                });

                this._strategies = _strategies;

                return _strategies;

            }));

        },

        /**
         * Gets you all current strategies, key is name, value is path
         *
         * @returns {{}}
         */
        strategies: function () {
            return this._strategies;
        },

        /**
         * Factory for creating and starting sockets, use this.refreshStrategies before starting up anything to make
         * sure you have the latest (unless you know you do, then don't refresh them)
         *
         * @param named
         * @param options
         */
        startupSocket: function (named, options) {

            var alfred      = this.nexus('titan:Alfred'),
                _options    = options,
                activeServer;

            //if there is an active server in alfred, use its http server (maybe support more later if needed)
            if (alfred) {

                activeServer = alfred.activeServers()[0];

                if (activeServer) {
                    _options.http = activeServer.http();
                }

            }

            if (!this._strategies) {
                throw new Error('You must call refreshStrategies() on liquidfire:Sockets before you can startup a socket server.');
            }

            if (!_.has(this._strategies, named)) {
                throw new Error('No socket strategy named "' + named + '" available. Options are: ' + Object.keys(this._strategies).join(', '));

            }

            //forge the socket strategy
            return this.forge(this._strategies[named], _options).then(function (strategy) {

                //keep list of all active server
                this._activeSockets.push(strategy);

                if (alfred) {
                    activeServer = alfred.activeServers()[0];
                }

                //if there is a web server,
                if (activeServer) {
                    strategy.configureWebServer(activeServer);
                }

                return strategy.execute();

            }.bind(this));

        },

        teardown: function () {

            return this.all(_.map(this._activeSockets, function (s) {
                return s.teardown();
            }));

        }



    });
});