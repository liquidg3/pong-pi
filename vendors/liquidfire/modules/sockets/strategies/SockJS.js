define(['altair/facades/declare',
        './_Base',
        'altair/plugins/node!sockjs',
        'altair/plugins/node!http',
        'altair/plugins/config!./schema.json'
], function (declare,
             _Base,
             sockjs,
             http,
             schema) {

    return declare([_Base], {

        _schema: schema,
        _client: null,
        _http:   null,
        _customServer: false,
        _activeConnections: null,

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

            this.log('starting Sockjs');

            //let normal startup run, then create server
            return this.inherited(arguments).then(function () {

                //setup js
                this._js = ['http://cdn.sockjs.org/sockjs-0.3.min.js', '/public/_sockets/js/Sockets.js', '/public/_sockets/js/SockJS.js?url=' + this.get('host') + ':' + this.get('port') + this.get('path')];

                //create a socket server
                this._client = sockjs.createServer(options);

                //did we receive an http server?
                if (options.http) {
                    this.log('using existing http server');
                    this._http = options.http;
                } else {
                    this.log('creating http server');
                    this._http = http.createServer();
                    this._customServer = true;
                }

                this._http.on('error', function (err) {
                    this.log(err);
                }.bind(this));

                //events
                this._http.on('connection', function (conn) {

                    //emit our connect event
                    this.parent.emit('did-connect', {
                        connection: conn,
                        strategy: this
                    });

                    conn.on('data', function (message) {

                        this.onMessage(message);

                    }.bind(this));

                    conn.on('error', function (err) {
                        this.log(err);
                    }.bind(this));

                    //emit close event
                    conn.on('close', function () {

                        this.parent.emit('did-disconnect', {
                            connection: conn,
                            strategy: this
                        });

                    }.bind(this));

                }.bind(this));

                return this;

            }.bind(this));

        },

        /**
         * Attach to and start http server if one is not started.
         */
        execute: function () {

            var options = {};

            if(this.get('path')) {
                options.prefix = this.get('path');
            }

            this.log('installing socket handlers');

            this._client.installHandlers(this._http, options);

            if(this._customServer) {
                this.log('starting http server on port: ' + this.get('port'));
                this._http.listen(this.get('port'), '0.0.0.0');
            }

        },

        /**
         * @param message string message directly from sockjs
         */
        onMessage: function (message) {

            console.log('message' + message);


        }


    });

});