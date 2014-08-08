define(['altair/facades/declare',
    './_Base',
    'altair/events/Deferred',
    'altair/plugins/node!http',
    'altair/plugins/node!socket.io',
    'altair/plugins/node!../public/js/Socket.io.js',
    'altair/plugins/config!./schema.json',
    'lodash'
], function (declare, _Base, Deferred, http, io, Client, schema, _) {

    return declare([_Base], {
        _ignoreExtensions:  ['events'],
        _schema:            schema,
        _http:              null,
        _server:            null,
        _client:            null,
        _serversByPort:     {}, //global static cache of server sockets
        _activeConnections: null,
        _activeListeners:   null,
        _onDeferreds:       null,

        /**
         * Setup the socket adapter.
         *
         * @param options
         * @returns {altair.Promise}
         */
        startup: function (options) {

            var _options = options || this.options || {};

            //so we can track everyone who is connected
            this._activeConnections = [];

            //all event listeners set from a client
            this._activeListeners = [];


            //let normal startup run, then create server
            return this.inherited(arguments).then(function () {

                    this.log('setting up socket.io ' + this.get('mode') + ' @ ' + this.url());

                    //our js with path host settings, etc.
                    this._js = ['https://cdn.socket.io/socket.io-1.0.6.js', '/public/_sockets/js/Sockets.js', '/public/_sockets/js/Socket.io.js?url=' + this.url()];

                    //if we are in server modes
                    if (['server', 'relay'].indexOf(this.get('mode')) > -1) {
                        this.setupServer();
                    }

                    //connect to our server
                    if (['client', 'relay'].indexOf(this.get('mode')) > -1) {
                        this.setupClient();

                    }

                    return this.all({
                        _cleaner: this.parent.forge('util/EventCleaner')
                    });

                }.bind(this)).then(function (deps) {

                    declare.safeMixin(this, deps);

                    return this;

                }.bind(this));

        },

        url: function () {
            return this.get('host', '') + ':' + this.get('port', '') + this.get('path', '');
        },

        /**
         * Gives you a connection for a particular namespace.
         *
         * @param name
         * @returns {*}
         */
        connectionForNamespace: function (name) {

            if (name[0] !== '/') {
                name = '/' + name;
            }

            return this._server.of(name);

        },

        /**
         * convenience methods for setting listeners
         *
         * @param event
         */
        on: function (event, query) {

            var dfd = new Deferred(),
                cb = _.isFunction(query) ? query : function () {},
                resolve = function (data) {
                    var e = this.coerceEvent(event, data);
                    cb(e);
                    dfd.resolve(e);

                }.bind(this);

            try {

                if (this.get('mode') === 'server') {

                    if (this.get('path')) {

                        this.server().on(event, resolve);
                    } else {

                        this.server().sockets.on(event, resolve);
                    }


                } else {

                    this._client.on(event, query, resolve);

                }

            } catch (e) {
                dfd.reject(e);
            }

            return dfd;

        },

        emit: function (event, data) {

            if (['server', 'relay'].indexOf(this.get('mode')) > -1) {
                this.server().emit(event, data);
            }

            if (['client', 'relay'].indexOf(this.get('mode')) > -1) {
                this.client().emit(event, data);
            }

        },

        /**
         * Make an event name and data into an event, or keep it an event if it is already one.
         *
         * @param event
         * @param data
         * @returns {*}
         */
        coerceEvent: function (event, data) {

            //its already an event
            if (data.data) {

                event = data;
                event.data = this.populateEventData(data.data);

                return event;
            }

            data = this.populateEventData(data);

            return this.inherited(arguments);
        },

        populateEventData: function (data) {

            var _data = data || {};

            if (_.isString(_data)) {
                _data = {
                    message: _data
                };
            }

            //if data is a socket (can happen on connection events) lets swap some things around
            if (data && data.acks) {
                _data = {
                    connection: data
                };
            }

            _data.strategy = this;
            _data.mode = this.get('mode');
            _data.port = this.get('port');
            _data.host = this.get('host');
            _data.path = this.get('path');
            _data.client = this.client();
            _data.server = this.server();

            return _data;

        },

        parentEmit: function (event, data) {

            var _data = this.populateEventData(data);

            return this.parent.emit(event, data);

        },

        server: function () {

            if (this._server && this.get('path')) {
                return this.connectionForNamespace(this.get('path'));
            }

            return this._server;
        },

        client: function () {
            return this._client;
        },

        /**
         * Setup the socket server
         *
         * @returns {sockets.strategies._Base}
         */
        setupServer: function () {

            if (this._serversByPort[this.get('port')]) {

                this._server = this._serversByPort[this.get('port')];

            } else {

                this._http = http.createServer();
                this._server = io.listen(this._http, { path: this.get('path')});

                this._http.on('error', function (err) {
                    console.log(err);
                });

            }

            this.on('error', function (e) {
                this.log('server error:');
                this.log(e.get('message'));
            }.bind(this));

            //events
            this.on('connection', function (e) {

                var conn = e.get('connection');

                this._activeConnections.push(conn);

                //emit our connect event
                this.parentEmit('did-connect', {
                    connection: conn
                });

                //remote end is registering for an event
                conn.on('register-listener', function (message, callback) {
                    this.registerEventListener(conn, message, callback);
                }.bind(this));

                conn.on('client-event', function (message, callback) {
                    this.dispatchClientEvent(conn, message, callback);
                }.bind(this));

                conn.on('error', function (err) {
                    this.log('server error (passed from client)');
                    this.log(err);
                }.bind(this));

                //emit close event
                conn.on('disconnect', function () {

                    this.parentEmit('did-disconnect', {
                        connection: conn
                    });

                    this.unRegisterEventListeners(conn);
                    this._activeConnections.splice(this._activeConnections.indexOf(conn), 1);

                }.bind(this));

            }.bind(this));

            return this;
        },

        /**
         * Setup the client, which is our ../public/js/Socket.io.js class
         */
        setupClient: function () {

            var url = this.url();

            this._client = new Client({
                url: url
            });

            this.on('error').then(function (e) {
                this.log('client error:');
                this.log(e.get('error'));
            }.bind(this));

            this.on('connect', function () {

                this.log('connected to server.');

                this.parentEmit('did-connect', {
                    connection: this._client
                });

            }.bind(this));

        },

        /**
         * The options passed to the client on connect(). You will need this if you are connecting manually and want
         * to honor the current configuration.
         */
        clientOptions: function () {

            //custom options
            var _options = _.clone(this.options);

            //options that can break the client
            delete _options.host;
            delete _options.port;
            delete _options.mode;
            delete _options.path;

            return _options;
        },


        /**
         * Attach to and start http server if one is not started.
         */
        execute: function () {

            this.deferred = new this.Deferred();

            //only startup one server per port (we share across socket.io strategies)
            //we work with the raw (non namespaced) server here
            if (this._server && !this._serversByPort[this.get('port')] && ['server', 'relay'].indexOf(this.get('mode')) > -1) {

                //cache server
                this._serversByPort[this.get('port')] = this._server;

                //listen on our port and resolve once listening is enabled
                this._http.listen(this.get('port'), function () {

                    if (this.deferred) {
                        this.deferred.resolve(this);
                    }

                }.bind(this));

            } else if (this.get('mode') === 'client') {


                if (this.get('connectOnExecute')) {
                    this.client().connect(this.clientOptions());
                }

                this.deferred.resolve(this);

            } else {

                this.deferred.resolve(this);

            }

            return this.inherited(arguments);

        },

        /**
         * Registers a callback for the event for the passed "connection". Anytime the local event occurrs, we'll
         * pass it through to the client.
         *
         * @param connection
         * @param data { __id: "aoeuKOE", __event: "titan:Alfred::did-receive-request", query: '{}' }
         */
        registerEventListener: function (connection, data, callback) {

            data.connection = connection;

            data.deferred = this.parent.on(data.event, function (e) {

                var d = _.clone(e.data);
                d.__event = data.event;
                d.__id = data.id;
                d = this._cleaner.cleanEventData(d);

                connection.emit('dispatch-server-event', d);

            }.bind(this), data.query);

            this._activeListeners.push(data);
            callback(true);

        },

        /**
         * A client has dispatched an even, lets route it through our parent.
         *
         * @param connection
         * @param data
         * @param callback
         */
        dispatchClientEvent: function (connection, data, callback) {

            var dfd = this.parentEmit(data.__event, data);

            if (callback) {
                dfd.then(callback);
            }

        },

        /**
         * Removes all event listeners set by this connection
         *
         * @param connection
         * @returns {sockets.strategies._Base}
         */
        unRegisterEventListeners: function (connection) {

            this._activeListeners = _.filter(this._activeListeners, function (data) {

                if (data.connection === connection) {

                    this.parent.removeEventListener(data.event, data.deferred);

                    return false;

                } else {
                    return data;
                }

            }, this);

            return this;

        },

        /**
         * Disconnect server and client
         *
         * @returns {*}
         */
        teardown: function () {

            var all = [],
                dfd1,
                dfd2;

            if (['server', 'relay'].indexOf(this.get('mode')) > -1) {

                this.log('tearing down socket.io server');
                dfd1 = new this.Deferred();
                all.push(dfd1);

                delete this._serversByPort[this.get('port')];

                this._http.close(this.hitch(dfd1, 'resolve'));

            }

            if (['client', 'relay'].indexOf(this.get('mode')) > -1) {

                dfd2 = new this.Deferred();
                all.push(dfd2);

                this.log('tearing down socket.io client');

                try {

                    this._client.disconnect(function () {

                        //disconnect does not happen at the right time for reals
                        setTimeout(this.hitch(dfd2, 'resolve'), 500);

                    }.bind(this));


                } catch (e) {
                    dfd2.reject(e);
                }

            }

            return this.all(all).then(function () {
                return this;
            }.bind(this));

        }


    });

});