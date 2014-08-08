define(['altair/facades/declare',
    'liquidfire/modules/curium/controllers/ViewController',
    'altair/facades/mixin'
], function (declare, ViewController, mixin) {

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
        leftPaddles:                 null,
        rightPaddles:                null,
        balls:                       null,
        paddleColumnWidth:           200,
        paddleWidth:                 10,
        paddleHeight:                100,
        sidePadding:                 100,
        ballRadius:                  10,    //starting ball radius
        currentColor:                null,
        _players:                    null, //players by side

        //a view controller is a lifecycle object - https://github.com/liquidg3/altair/blob/master/docs/lifecycles.md
        startup:                     function (options) {

            return this.inherited(arguments).then(function () {

                //listener for player joining
                this.app.on('player-did-join', this.hitch('onPlayerDidJoin'));
                this.app.on('player-did-quit', this.hitch('onPlayerDidQuit'));

                //starting colors
                this.currentColor = this.colors[options.startColor || 0];
                this.view.backgroundColor = 'rgba(' + this.currentColor.r + ', ' + this.currentColor.g + ', ' + this.currentColor.b + ', 1)';

                //beginning state
                this.rightPaddles   = [];
                this.leftPaddles    = [];
                this.balls          = [];
                this._players       = {};


                return this;

            }.bind(this));
        },

        //use the "WillEnter" to load your resources; views, sounds, etc.
        onStateMachineWillEnterGame: function (e) {

            this.animateBackgroundToNextColor();

        },

        onStateMachineDidEnterGame: function (e) {

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

            this.log('forging paddle at', _options.frame);

            return this.forgeView(_options);

        },

        forgeBall: function (options) {

            var _options = mixin({
                backgroundColor: '#fff',
                frame:           {
                }
            }, options || {});

            _options.frame.width = this.ballRadius;
            _options.frame.height = this.ballRadius;

            return this.all({
                ball:       this.forgeView('Ball', _options),
                velocity:   this.forgeBehavior('Velocity'),
                collision:  this.forgeBehavior('Collision')
            }).then(function (all) {

                var ball        = all.ball,
                    velocity    = all.velocity,
                    collision   = all.collision;

                ball.addBehavior(velocity);
                ball.addBehavior(collision);

                return ball;

            });


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

            if (!this._players[player.side]) {
                this._players[player.side] = [];
            }

            this._players[player.side].unshift(player);

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
                player.paddle.addBehavior(objects.behavior);

                this.view.addSubView(objects.paddle);

                this.animatePaddlesIntoPlace();

            }.bind(this));

        },


        removePlayer: function (player) {

            var players = this._players[player.side] || [];

            players.splice(players.indexOf(player), 1);

            if (player.paddle) {
                player.paddle.removeFromSuperView();
                this.animatePaddlesIntoPlace();
            }


        },


        animatePaddlesIntoPlace: function () {

            _.each(['left', 'right'], function (side) {

                _.each(this._players[side] || [], function (player) {

                    player.paddle.animate('frame.left', this.paddleLeft(player), 1000);

                }, this);

            }, this);

        },

        paddleLeft: function (player) {

            var left,
                index = this._players[player.side].indexOf(player);

            left = index * this.paddleColumnWidth;

            if (player.side === 'right') {

                left = this.view.frame.width - left - ((index + 1) * this.paddleWidth) - this.sidePadding;

            } else {
                left = left + this.sidePadding;
            }

            return left;

        }


    });

});