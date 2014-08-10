define(['altair/facades/declare',
        'liquidfire/modules/curium/controllers/ViewController',
        'altair/facades/mixin',
        'lodash'
], function (declare, ViewController, mixin, _) {

    return declare([ViewController], {

        /**
         * Every controller uses an altair/StateMachine for state management - https://github.com/liquidg3/altair/blob/master/docs/statemachine.md
         */
        states:                      ['game'],
        colors:                      [
            [216, 203, 1],
            [0, 173, 61],
            [216, 1, 94]
        ],
        balls:                       null,
        paddleColumnWidth:           200,
        paddleWidth:                 10,
        paddleHeight:                100,
        sidePadding:                 100,
        ballRadius:                  10,    //starting ball radius
        currentColor:                null,
        players:                    null, //players by side

        //a view controller is a lifecycle object - https://github.com/liquidg3/altair/blob/master/docs/lifecycles.md
        startup:                     function (options) {

            return this.inherited(arguments).then(function () {

                //beginning state
                this.balls          = [];
                this.players        = {
                    left: [],
                    right: []
                };


                //starting colors
                this.currentColor           = this.colors[options.startColor || 0];
                this.view.backgroundColor   = 'rgba(' + this.currentColor.r + ', ' + this.currentColor.g + ', ' + this.currentColor.b + ', 1)';

                //pre-load instruction views
                return this.all({
                    leftInstructions: this.forgeView('Instructions', {
                        frame: _.clone(this.view.frame)
                    }),
                    rightInstructions: this.forgeView('Instructions', {
                        frame: _.clone(this.view.frame)
                    })
                });

            }.bind(this)).then(function (views) {

                declare.safeMixin(this, views);

                //place views
                this.leftInstructions.frame.width   = this.rightInstructions.frame.width = this.view.frame.width / 2;
                this.rightInstructions.frame.left   = this.view.frame.width / 2;

                this.view.addSubView(this.leftInstructions);
                this.view.addSubView(this.rightInstructions);


                //listener for player joining
                this.app.on('player-did-join', this.hitch('onPlayerDidJoin'));
                this.app.on('player-did-quit', this.hitch('onPlayerDidQuit'));

                //scoring
                this.on('score').then(this.hitch('onDidScore'));
                this.on('paddle-collision', this.hitch('onDidHitPaddle'));

                return this;

            }.bind(this));
        },

        //use the "WillEnter" to load your resources; views, sounds, etc.
        onStateMachineWillEnterGame: function (e) {
            this.animateBackgroundToNextColor();
        },

        onStateMachineDidEnterGame: function (e) {


        },

        forgeBlock: function (options) {

            var _options = options || _options;

            //@todo: better validation, with some helpful errors here..  sorry, in a rush!

            return this.all({
                block:     this.forgeView('Block', _options),
                collision:  this.forgeBehavior('Collision', {
                    group: this.collisionGroup()
                })
            }).then(function (objects) {

                var block = objects.block;
                block.addBehavior(objects.collision);

                return block;

            });

        },

        forgePaddle: function (options) {

            var _options = mixin({
                backgroundColor: '#fff',
                frame:           {
                }
            }, options || {});

            _options.frame.width    = _options.frame.width || this.paddleWidth;
            _options.frame.top      = _options.frame.top || this.view.frame.height / 2 - this.paddleHeight / 2;
            _options.frame.height   = _options.frame.height || this.paddleHeight;

            return this.all({
                paddle:     this.forgeView('Paddle', _options),
                collision:  this.forgeBehavior('Collision', {
                    group: this.collisionGroup()
                })
            }).then(function (objects) {

                var paddle = objects.paddle;
                paddle.addBehavior(objects.collision);

                return paddle;

            });

        },

        collisionGroup: function () {
            return 'group-group';
        },

        forgeBall: function (options) {

            var _options = mixin({
                backgroundColor: '#fff',
                frame:           {
                }
            }, options || {});

            _options.frame.width    = this.ballRadius;
            _options.frame.height   = this.ballRadius;
            _options.frame.left     = this.view.frame.width / 2 - this.ballRadius / 2;
            _options.frame.top      = this.view.frame.height / 2 - this.ballRadius / 2;

            return this.all({
                ball:       this.forgeView('Ball', _options),
                behavior:   this.forgeBehavior('Ball')
            }).then(function (objects) {

                var ball        = objects.ball,
                    behavior    = objects.behavior;

                ball.addBehavior(behavior);
                this.balls.push(ball);

                return ball;

            }.bind(this));


        },


        animateBackgroundToNextColor: function () {

            var color = this.colors[Math.floor(Math.random() * 3)];

            //every view controller has a view property that represents its main view
            //i want it to be one of our colors
            this.view.animate({
                r: color[0],
                g: color[1],
                b: color[2]
            }, 10000, {
                setOnView: false,
                from: {
                    r: this.currentColor[0],
                    g: this.currentColor[1],
                    b: this.currentColor[2]
                }
            }).step(function (color) {

                color = 'rgba(' + color.r + ', ' + color.g + ', ' + color.b + ', 1)';
                this.view.backgroundColor = color;

            }.bind(this)).then(this.hitch(function () {

                this.currentColor = color;
                this.animateBackgroundToNextColor();

            })).otherwise(function (err) {
                this.log('background coloring error');
                this.log(err);
            }.bind(this));


        },

        onPlayerDidJoin: function (e) {

            var player = e.get('player');

            this.addPlayer(player).otherwise(function (err) {
                this.log('error adding player');
                this.log(err);
            }.bind(this));

        },

        onPlayerDidQuit: function (e) {

            var player = e.get('player');

            this.removePlayer(player);
        },

        addPlayer: function (player) {

            this.players[player.side].unshift(player);

            return this.all({
                behavior: this.forgeBehavior('Paddle', {
                    player: player
                }),
                paddle: this.forgePaddle({
                    frame: {
                        left: player.side === 'left' ? -this.paddleWidth : this.view.frame.width
                    }
                })
            }).then(function (objects) {

                player.paddle = objects.paddle;
                objects.paddle.player = player;
                player.paddle.addBehavior(objects.behavior);

                this.view.addSubView(objects.paddle);

                this.rebuildBoard();

            }.bind(this));

        },

        toggleInstructions: function () {

            this.leftInstructions.hidden = (this.players.left.length > 0);
            this.rightInstructions.hidden = (this.players.right.length > 0);

        },


        removePlayer: function (player) {

            var players = this.players[player.side] || [];

            players.splice(players.indexOf(player), 1);

            if (player.paddle) {
                player.paddle.teardown();
            }

            this.rebuildBoard();

        },

        rebuildBoard: function () {

            this.animatePaddlesIntoPlace();
            this.toggleInstructions();

            if (this.players.left.length > 0 && this.players.right.length > 0 && this.balls.length === 0) {
                setTimeout(this.hitch('dropBall'), 2000);
            } else if (this.players.left.length === 0 || this.players.right.length === 0 && this.balls.length > 0) {
                _.each(this.balls, this.hitch('teardownBall'));
            }

        },


        animatePaddlesIntoPlace: function () {

            _.each(['left', 'right'], function (side) {

                _.each(this.players[side] || [], function (player) {

                    player.paddle.animate('frame.left', this.paddleLeft(player), 1000);

                }, this);

            }, this);

        },

        paddleLeft: function (player) {

            var left,
                index = this.players[player.side].indexOf(player);

            left = index * this.paddleColumnWidth;

            if (player.side === 'right') {

                left = this.view.frame.width - left - ((index + 1) * this.paddleWidth) - this.sidePadding;

            } else {

                left = left + this.sidePadding;

            }

            return left;

        },

        teardownBall: function (ball) {

            if (ball) {
                this.balls.splice(this.balls.indexOf(ball), 1);
                ball.teardown();
            } else {
                console.log('tearing down a ball that does not exist');
            }

        },

        dropBall: function () {

            if (this.players.left.length > 0 && this.players.right.length > 0) {

                //drop another ball in 3 seconds
                return this.forgeBall().then(function (ball) {
                    this.view.addSubView(ball);
                }.bind(this));

            }

        },

        onDidScore: function (e) {

            var ball = e.get('ball');

            this.teardownBall(ball);

            setTimeout(this.hitch('dropBall'), 2000);

            //give a point to all players on the side that scored
            _.each(this.players[e.get('side')], function (player) {
                player.score(1);
            });


        },

        onDidHitPaddle: function (e) {

            var player = e.get('player');
            player.score(1);

        }


    });

});