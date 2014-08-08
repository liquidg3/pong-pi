define(['altair/facades/declare',
        'liquidfire/modules/curium/models/App'
], function (declare,
             App) {

    return declare([App], {

        _server: null,
        startup: function (options) {

            var _options = options || this.options || {};

            this.nexus('liquidfire:Sockets').startupSocket('socketio', {
                port: 6789,
                host: '10.1.10.98'
            }).then(function (server) {

                this._server = server;

//                server.on('connection').then(this.hitch('onDidConnect'));
//                server.on('disconnect').then(this.hitch('onDidDisconnect'));
//                server.on('error', this.log.bind(this));

            }.bind(this));

            return this.inherited(arguments);
        }

    });

});