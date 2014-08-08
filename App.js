define(['altair/facades/declare',
    'liquidfire/modules/curium/models/App',
    'altair/plugins/node!os'
], function (declare, App, os) {

    return declare([App], {

        _server: null,
        startup: function (options) {

            var _options = options || this.options || {},
                ifaces = os.networkInterfaces(),
                dev,
                alias,
                ip;

            for (dev in ifaces) {

                alias = 0;
                ifaces[dev].forEach(function (details) {
                    if (details.family === 'IPv4') {
                        ip = details.address;
                        ++alias;
                    }
                });
            }

            if (!ip) {
                throw new Error('App could not detect IP');
            }

            this.nexus('liquidfire:Sockets').startupSocket('socketio', {
                port: 6789,
                host: 'http://' + ip
            }).then(function (server) {

                this._server = server;

                server.on('connection').then(this.hitch('onDidConnect'));
                server.on('disconnect').then(this.hitch('onDidDisconnect'));
                server.on('picked-side').then(this.hitch('onDidPickSide'));
                server.on('error', this.log.bind(this));

            }.bind(this));

            return this.inherited(arguments);
        },

        onDidConnect: function (e) {

            var connection = e.get('connection');

        },

        onDidDisconnect: function (e) {

        },

        onDidPickSide: function (e) {

            var connection = e.get('connection');
            console.log(e.get('side'));
        }

    });

});