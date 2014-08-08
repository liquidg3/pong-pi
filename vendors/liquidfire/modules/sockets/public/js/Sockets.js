(function (altair) {

    "use strict";

    if (!altair) {
        altair = {};
        window.altair = altair;
    }

    if (!altair.sockets) {

        /**
         * Sockets constructor
         *
         * @constructor
         */
        var Sockets = function () {

            this._adapter = null; //my selected adapter

        };

        /**
         * Add a strategy to our active ones.
         *
         * @param strategy
         * @returns {Sockets}
         */
        Sockets.prototype.setAdapter = function (adapter) {

            this._adapter = adapter;

            return this;

        };

        /**
         * Some error reporting for debug oopsies
         *
         * @private
         */
        Sockets.prototype._assertAdapter = function () {

            if (!this._adapter) {
                throw new Error('Altair.Sockets requires a valid socket adapter to work properly.');
            }

        };

        /**
         * Delegates call to this._adapter. Is expected to make a connection.
         *
         * @param options
         * @returns {*|Socket}
         */
        Sockets.prototype.connect = function (options) {
            this._assertAdapter();
            return this._adapter.connect(options);
        };

        /**
         * Sends a message through the connection
         *
         * @param message
         * @returns {*|Socket}
         */
        Sockets.prototype.send = function (message) {
            this._assertAdapter();
            return this._adapter.send(message);
        };

        /**
         * Dispatches an event through the adapter to whatever it is connected to
         *
         * @param message
         * @returns {*|Socket}
         */
        Sockets.prototype.emit = function (name, data, cb) {

            this._assertAdapter();
            return this._adapter.emit(name, data, cb);
        };

        /**
         * Listen in on an event
         * @param event the name of the event, eg titan:Alfred::did-receive-request
         * @param query a query { request.method: 'POST' } (if missing, assumed to be callback)
         * @param callback a function to call whenever that query hits on the server
         * @returns {*}
         */
        Sockets.prototype.on = function (event, query, callback) {

            this._assertAdapter();
            return this._adapter.on(event, query, callback);
        };

        //currently only 1 active sockets at a time.
        altair.sockets = new Sockets();


    }

}(window.altair));