define(['altair/facades/declare',
    'liquidfire/modules/curium/models/App',
    'altair/plugins/node!os'
], function (declare, App, os) {

    return declare([App], {

        _server: null,
        players: null,
        startup: function (options) {

            var _options = options || this.options || {},
                ifaces = os.networkInterfaces(),
                dev,
                alias,
                ip;

            this.players = []; //initialize

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

            this.ip = ip;
            this.nexus('liquidfire:Sockets').startupSocket('socketio', {
                port: 6789,
                host: 'http://' + ip
            }).then(function (server) {

                this._server = server;

                server.on('connection').then(this.hitch('onDidConnect'));
                server.on('error', this.log.bind(this));

            }.bind(this));

            return this.inherited(arguments);
        },

        onDidConnect: function (e) {

            var connection = e.get('connection'),
                player     = this.forgeSync('models/Player', {
                    connection: connection
                });

            this.players.push(player);
            connection.player = player;

            connection.on('picked-side', this.hitch('onDidPickSide', connection));
            connection.on('disconnect', this.hitch('onDidDisconnect', connection));
            connection.on('enter-username', this.hitch('onDidEnterUsername', connection));
            connection.on('join', this.hitch('joinGame', connection));
            connection.on('color', this.hitch('setColor', connection));

        },

        setColor: function (connection, data) {

            //set color to the user
            this.log(connection.player.username + ' selected color ' + data.color);
            connection.player.paddleColor = data.color;

        },

        onDidDisconnect: function (connection) {

            this.emit('player-did-quit', {
                player: connection.player
            });

            this.players.splice(this.players.indexOf(connection.player), 1);

        },

        onDidEnterUsername: function (connection, data) {

            this.log('user picked username:', data.username);
            connection.player.username = data.username;

        },

        onDidPickSide: function (connection, data) {

            this.log('user picked side:', data.side);
            connection.player.side = data.side;
        },

        joinGame: function (connection) {

            this.emit('player-did-join', {
                player: connection.player
            });

        }

    });

});