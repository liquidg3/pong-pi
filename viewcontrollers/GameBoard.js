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
        paddleWidth:                 10,
        paddleHeight:                100,
        ballRadius:                  10, //starting ball radius
        currentColor:                null,

        //a view controller is a lifecycle object - https://github.com/liquidg3/altair/blob/master/docs/lifecycles.md
        startup:                     function (options) {

            return this.inherited(arguments).then(function () {

                //listener for player joining
                this.app.on('player-did-join', this.hitch('onPlayerDidJoin'));

                //starting colors
                this.currentColor = this.colors[options.startColor || 0];
                this.view.backgroundColor = 'rgba(' + this.currentColor.r + ', ' + this.currentColor.g + ', ' + this.currentColor.b + ', 1)';

                //beginning state
                this.rightPaddles   = [];
                this.leftPaddles    = [];
                this.balls          = [];


                return this;

            }.bind(this));
        },

        //use the "WillEnter" to load your resources; views, sounds, etc.
        onStateMachineWillEnterGame: function (e) {

            this.animateBackgroundToNextColor();

            return this.all({
                ball:        this.forgeBall({
                    borderRadius: 25,
                    clipping: true,
                    frame: {
                        left: this.view.frame.width / 2 - this.ballRadius  / 2,
                        top: this.view.frame.height / 2 - this.ballRadius  / 2
                    }
                }),
                leftPaddle:  this.forgePaddle({
                    frame: {
                        left: 100,
                        top:  this.view.frame.height / 2 - this.paddleHeight / 2
                    }
                }),
                rightPaddle: this.forgePaddle({
                    frame: {
                        left: this.view.frame.width - this.paddleWidth - 100,
                        top:  this.view.frame.height / 2 - this.paddleHeight / 2
                    }
                })
            });


        },

        onStateMachineDidEnterGame: function (e) {

            this.leftPaddles.push(e.get('leftPaddle'));
            this.rightPaddles.push(e.get('rightPaddle'));
            this.balls.push(e.get('ball'));

            //add subviews to
            this.view.addSubView(this.leftPaddles[0]);
            this.view.addSubView(this.balls[0]);
            this.view.addSubView(this.rightPaddles[0]);

        },

        forgePaddle: function (options) {

            var _options = mixin({
                backgroundColor: '#fff',
                frame:           {
                }
            }, options || {});

            _options.frame.width = this.paddleWidth;
            _options.frame.height = this.paddleHeight;

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

            console.log('player joined', player.username);

        }





    });

});