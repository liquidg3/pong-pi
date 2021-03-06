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
        balls:                       null,  //all the active balls
        ballSpeed:                   10,     //how fast do your balls move
        paddleColumnWidth:           30,   //each player fits into a column, this is that columns width (the smaller, the closer each paddle will be)
        paddleWidth:                 5,    //how wide is the paddle?
        paddleHeight:                60,   //how tall is the paddle?
        sidePadding:                 50,   //how far in from the side will each paddle start
        ballRadius:                  5,    //starting ball radius
        currentColor:                null,  //background color tracking
        players:                     null,  //players by side
        playableRect:                null,  //the screen bounds within which all visual game components is confined to taking place within
        totalBalls:                  2,     //how many balls can be out at any 1 time?
        powerUps:                    null,
        powerUpInterval:             10000, //how often will power ups drop into place
        _powerUpInterval:            null,
        _dropBallTimeout:            null,

        //a view controller is a lifecycle object - https://github.com/liquidg3/altair/blob/master/docs/lifecycles.md
        startup:                     function (options) {

            return this.inherited(arguments).then(function () {

                this.playableRect = {
                    top:    this.view.frame.top,
                    left:   this.view.frame.left,
                    width:  this.view.frame.width,
                    height: this.view.frame.height
                };

                //beginning state
                this.balls          = [];
                this.powerUps       = [];
                this.players        = {
                    left: [],
                    right: []
                };
                //starting colors
                this.currentColor           = this.colors[options.startColor || 0];
                this.view.backgroundColor   = 'rgba(' + this.currentColor.r + ', ' + this.currentColor.g + ', ' + this.currentColor.b + ', 1)';

                //listener for player joining
                this.app.on('player-did-join', this.hitch('onPlayerDidJoin'));
                this.app.on('player-did-quit', this.hitch('onPlayerDidQuit'));

                //scoring
                this.on('score').then(this.hitch('onDidScore'));
                this.on('paddle-collision', this.hitch('onDidHitPaddle'));
                this.on('power-up-collision', this.hitch('onDidHitPowerUp'));

                return this;

            }.bind(this));
        },

        //use the "WillEnter" to load your resources; views, sounds, etc.
        onStateMachineWillEnterGame: function (e) {

            this.animateBackgroundToNextColor();

            this.leftInstructions = this.forgeView('Instructions', {
                frame: _.clone(this.view.frame)
            });

            this.rightInstructions = this.forgeView('Instructions', {
                frame: _.clone(this.view.frame)
            });

            //place views
            this.leftInstructions.frame.width   = this.rightInstructions.frame.width = this.view.frame.width / 2;
            this.rightInstructions.frame.left   = this.view.frame.width / 2;

            this.view.addSubView(this.leftInstructions);
            this.view.addSubView(this.rightInstructions);



        },

        onStateMachineDidEnterGame: function (e) {


        },

        /**
         * Forge a paddle.
         *
         * @param options
         * @returns {*|Promise}
         */
        forgePaddle: function (options) {

            var _options = mixin({
                backgroundColor: '#fff',
                frame:           {
                }
            }, options || {});

            _options.frame.width    = _options.frame.width || this.paddleWidth;
            _options.frame.top      = _options.frame.top || this.view.frame.height / 2 - this.paddleHeight / 2;
            _options.frame.height   = _options.frame.height || this.paddleHeight;

            var paddle      = this.forgeView('Paddle', _options),
                collision   = this.forgeBehavior('Collision2', {
                    group: this.collisionGroup()
                });

            paddle.addBehavior(collision);

            return paddle;

        },

        /**
         * The collision group for this game board. If we ever had multiple game boards at once, we'd need to make this
         * random.
         *
         * @returns {string}
         */
        collisionGroup: function () {
            return 'group-group';
        },

        /**
         * Forge yourself a random powerup at a random spot. It will not be dropped onto the board
         *
         * @returns {*|Promise}
         */
        forgePowerUp: function () {

            var rand    = Math.round(Math.random() * 2),
                image   = '',
                imageView,
                behavior;

            switch (rand) {
            case 0:
                image       = 'assets/images/star.png';
                behavior    = 'FastBall';
                break;
            case 1:
                image       = 'assets/images/scale.png';
                behavior    = 'PaddleGrowth';
                break;
            case 2:
                image       = 'assets/images/switch.png';
                behavior    = 'ScrollSwitch';
                break;
            }

            behavior = this.forgeBehavior(behavior);
            imageView = this.forgeView('Image', {
                image:           image,
                backgroundColor: 'transparent',
                frame: {
                    left: Math.random() * this.view.frame.width / 2 + this.view.frame.width / 4,
                    top:  Math.random() * this.view.frame.height / 2 + this.view.frame.height / 4
                }
            });

            imageView.addBehavior(behavior);

            return imageView.loadImage().then(function () {
                //console.log('image view forged', imageView.frame);
                return imageView;
            });

        },

        /**
         * Drop a powerup
         */
        dropPowerUp: function () {

            if (this.powerUps.length > 2) {
                return;
            }

            this.forgePowerUp().then(function (powerUp) {
                this.powerUps.push(powerUp);
                this.view.addSubView(powerUp);
            }.bind(this));



        },

        disablePowerUps: function () {

            if (this._powerUpInterval) {
                clearInterval(this._powerUpInterval);
                this._powerUpInterval = null;
            }

            _.each(this.powerUps, function (pu) {
                pu.teardown();
            });

            this.powerUps = [];

        },

        /**
         * Remove a power up
         * @param powerUp the view representing the powerup
         */
        removePowerUp: function (powerUp) {

            powerUp.teardown();
            this.powerUps.splice(this.powerUps.indexOf(powerUp), 1);

        },

        /**
         * Forge a ball
         *
         * @param options
         * @returns {*|Promise}
         */
        forgeBall: function (options) {

            var _options = mixin({
                backgroundColor: '#fff',
                frame:           {
                }
            }, options || {}),
                ball,
                behavior;

            _options.frame.width    = this.ballRadius;
            _options.frame.height   = this.ballRadius;
            _options.frame.left     = this.view.frame.width / 2 - this.ballRadius / 2;
            _options.frame.top      = this.view.frame.height / 2 - this.ballRadius / 2;

            ball        = this.forgeView('Ball', _options);
            behavior    = this.forgeBehavior('Ball');

            ball.behavior = behavior; //we'll need it elsewhere
            ball.addBehavior(behavior);
            this.balls.push(ball);

            return ball;

        },

        /**
         * Keep the background color animating
         */
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

            this.addPlayer(player);

        },

        onPlayerDidQuit: function (e) {

            var player = e.get('player');
            this.removePlayer(player);

        },

        /**
         * Add a player to the booard.
         *
         * @param player
         * @returns {*|Promise}
         */
        addPlayer: function (player) {

            var behavior = this.forgeBehavior('Paddle', {
                player: player
            }),
                paddle = this.forgePaddle({
                    backgroundColor: player.paddleColor,
                    frame: {
                        left: player.side === 'left' ? -this.paddleWidth : this.view.frame.width
                    }
                }),
                totalPlayers = this.totalPlayers();

            this.players[player.side].unshift(player);

            player.paddle   = paddle;
            paddle.player   = player;
            paddle.behavior = behavior;

            paddle.addBehavior(behavior);

            this.view.addSubView(paddle);

            if (totalPlayers > 2 && totalPlayers % 2) {
                this.totalBalls += 1;
            }

            this.rebuildBoard();

            return player;

        },

        totalPlayers: function () {
            return this.players.left.length + this.players.right.length;
        },

        /**
         * Will hide/show instruction views on each column
         */
        toggleInstructions: function () {

            this.leftInstructions.hidden = (this.players.left.length > 0);
            this.rightInstructions.hidden = (this.players.right.length > 0);

        },

        /**
         * Remove a player from the game (will automatically rebuild the board)
         *
         * @param player
         */
        removePlayer: function (player) {

            var players = this.players[player.side] || [],
                totalPlayers;

            players.splice(players.indexOf(player), 1);

            if (player.paddle) {
                player.paddle.teardown();
            }

            totalPlayers = this.totalPlayers();

            if (!(totalPlayers % 2)) {
                this.totalBalls = Math.max(1, this.totalBalls - 1);
            }

            this.rebuildBoard();

        },

        /**
         * Called every time a player leaves or enters
         */
        rebuildBoard: function () {

            this.animatePaddlesIntoPlace();
            this.toggleInstructions();

            if (this.players.left.length > 0 && this.players.right.length > 0 && !this._dropBallTimeout) {

                this._dropBallTimeout = setTimeout(this.hitch('dropBalls'), 3000);

            } else if ((this.players.left.length === 0 || this.players.right.length === 0) && this.balls.length > 0) {

                _.each(this.balls, this.hitch('teardownBall'));

            }

            //enable powerups
            if (this.players.left.length > 0 && this.players.right.length > 0 && !this._powerUpInterval) {

                this._powerUpInterval = setInterval(this.hitch(function () {

                    this.dropPowerUp();

                }), this.powerUpInterval);

            }
            //disable powerups
            else if (this.balls.length === 0) {
                this.disablePowerUps();
            }

        },

        /**
         * Will animate every paddle to its proper column.
         */
        animatePaddlesIntoPlace: function () {

            _.each(['left', 'right'], function (side) {

                _.each(this.players[side] || [], function (player) {

                    if (player.paddle) {
                        player.paddle.animate('frame.left', this.paddleLeft(player), 1000);
                    }

                }, this);

            }, this);

        },

        /**
         * Pass a player and i'll tell you in which column they should be placed (actually the left of the frame in
         * pixels);
         *
         * @param player
         * @returns {number}
         */
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

        dropBalls: function () {

            if (this.players.left.length > 0 && this.players.right.length > 0) {

                var c = this.balls.length,
                    ball,
                    max = this.totalBalls;

                for (c; c < max; c = c + 1) {

                    ball = this.forgeBall();
                    this.view.addSubView(ball);

                }

                this._dropBallTimeout = null;

            }

        },

        onDidScore: function (e) {

            var ball = e.get('ball');

            this.teardownBall(ball);

            setTimeout(this.hitch('dropBalls'), 2000);

            //give a point to all players on the side that scored
            _.each(this.players[e.get('side')], function (player) {
                player.score(5);
            });


        },

        onDidHitPaddle: function (e) {

            var player = e.get('player');
            player.score(1);

        },

        onDidHitPowerUp: function (e) {

            var powerUp = e.get('powerUp'),
                player  = e.get('player');

            this.removePowerUp(powerUp.view);
            powerUp.apply(this, player);

        }


    });

});