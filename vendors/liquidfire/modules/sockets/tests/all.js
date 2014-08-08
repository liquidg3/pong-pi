define(['altair/test',
    'altair/plugins/node!chai',
    'core/tests/support/boot',
    'altair/facades/hitch',
    'altair/facades/mixin',
    'altair/facades/series',
    'lodash',
    'altair/Deferred',
    'altair/plugins/config!./cartridges.json'],
    function (test, chai, boot, hitch, mixin, series, _, Deferred, cartridges) {

        /**
         * A ton of setup and teardown related utilities
         */
        var expect = chai.expect,
            strategy = 'socketio',
            timeout = 100000,
            options = {
                port:         7899,
                reconnection: false,
                forceNew:     true,
                host:         'http://localhost'
            },
            modules = {},
            server,
            client,
            setup = function (mode, _options) {

                return function (__options) {

                    if (!mode) {
                        mode = 'server';
                    }

                    return boot.nexus(cartridges).then(function (nexus) {

                        var s = nexus('liquidfire:Sockets');

                        modules[mode] = s;

                        //refresh strategies
                        return s.refreshStrategies().then(function () {

                            var ___options = mixin(options, _options || {}, __options || {});
                            ___options.mode = mode;

                            return s.startupSocket(strategy, ___options);

                        }).then(function (socket) {

                            if (mode === 'server' && !server) {
                                server = socket;
                            } else if (mode === 'client' && !client) {
                                client = socket;
                            }

                            return socket;

                        });

                    });
                };

            },
            teardown = function () {

                //i reverse teardown so clients disconnect before the server shuts down
                var _modules = _.toArray(modules).reverse(),
                    dfd = new Deferred();

                setTimeout(function () {

                    series(_.map(_modules, function (module) {
                        return function () {
                            return module.teardown();
                        };
                    })).then(function () {
                        modules = {};
                        server = null;
                        client = null;
                        dfd.resolve();
                    });

                }, 1000);


                return dfd;

            };

        /**
         * The actual tests!
         */
        test.register('sockets', [

            {
                name:     "startup & teardown server",
                setUp:    setup('server'),
                tearDown: teardown,
                runTest:  function () {

                    expect(modules.server._strategies).to.have.property('socketio');
                    expect(modules.server).to.have.property('_activeSockets').with.length(1);

                }
            },

            {
                name:     "startup client and server and connect",
                setUp:    setup('server'),
                tearDown: teardown,
                timeout:  timeout,
                runTest:  function () {

                    var triggered = 2,
                        dfd = new Deferred(),
                        finish = function () {

                            triggered -= 1;

                            if (triggered === 0) {
                                dfd.resolve();
                            }
                        };

                    modules.server.on('did-connect').then(function (e) {
                        finish();
                    }).otherwise(hitch(dfd, 'reject'));

                    setup('client')().then(function (client) {
                        expect(client.get('mode')).to.equal('client');
                        finish();
                    }).otherwise(hitch(dfd, 'reject'));

                    return dfd;

                }
            },

            {
                name:     "make sure client can dispatch event on the server",
                setUp:    setup('server'),
                tearDown: teardown,
                timeout:  timeout,
                runTest:  function () {

                    var dfd = new Deferred();

                    modules.server.on('altair:CommandCentral::custom-event').then(function (e) {
                        expect(e).to.have.property('name').and.equal('custom-event');
                        dfd.resolve();
                    });

                    setup('client')().then(function (client) {
                        client.emit('altair:CommandCentral::custom-event', { foo: 'bar' });
                    });

                    return dfd;

                }
            },

            {
                name:     "server connection callback receives proper events",
                setUp:    setup('server'),
                tearDown: teardown,
                timeout:  timeout,
                runTest:  function () {

                    var dfd = new Deferred();

                    server.on('connection').then(function (e) {

                        expect(e).to.have.property('data');

                        //shit will crash if i disconnect too soon
                        setTimeout(hitch(dfd, 'resolve'), 1000);

                    });

                    setup('client')();

                    return dfd;

                }
            },

            {
                name:     "server emits event and client receives proper event",
                setUp:    setup('server'),
                tearDown: teardown,
                timeout:  timeout,
                runTest:  function () {

                    var dfd = new Deferred();

                    server.on('connection').then(function (e) {

                        setTimeout(function () {
                            server.emit('custom-event', { foo: 'bar' });
                        }, 1000);

                    });

                    setup('client')().then(function (client) {

                        client.on('custom-event').then(function (e) {

                            expect(e.data).to.have.property('foo').and.equal('bar');

                            dfd.resolve();

                        });

                    });

                    return dfd;

                }
            },

            {
                name:     "server hears emit on single connection",
                setUp:    setup('server'),
                tearDown: teardown,
                timeout:  timeout,
                runTest:  function () {

                    var dfd = new Deferred();

                    server.on('connection').then(function (e) {

                        var con = e.get('connection');
                        con.on('custom-event', function (data) {
                            expect(data).to.have.property('foo').and.equal('bar');
                            dfd.resolve();
                        });


                    });

                    setup('client')().then(function (client) {

                        client.emit('custom-event', { foo: 'bar' });

                    });

                    return dfd;

                }
            },

            {
                name:     "server and client can handle paths",
                setUp:    setup('server', { path: '/test-path' }),
                tearDown: teardown,
                timeout:  timeout,
                runTest:  function () {

                    var dfd = new Deferred();

                    server.on('connection').then(function (e) {

                        var con = e.get('connection');
                        con.on('custom-event', function (data) {
                            expect(data).to.have.property('foo').and.equal('bar')
                            dfd.resolve();
                        });


                    });

                    setup('client')({ path: '/test-path' }).then(function (client) {
                        client.emit('custom-event', { foo: 'bar' });
                    });

                    return dfd;

                }
            }

        ]);

    });