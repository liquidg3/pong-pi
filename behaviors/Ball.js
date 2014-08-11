define(['altair/facades/declare',
        'liquidfire/modules/curium/behaviors/_Base',
        'altair/Lifecycle'
], function (declare,
             _Base,
             Lifecycle) {

    return declare([_Base, Lifecycle], {

        startDirection: -1, //1 === right, -1 === left
        velocity:       null,
        collision:      null,
        lastPlayer:     null,

        startup: function (options) {
            this.deferred = this.all({
                velocity:   options.vc.forgeBehavior('Velocity'),
                collision:  options.vc.forgeBehavior('Collision', {
                    group:  options.vc.collisionGroup(),
                    calculate: true
                })
            }).then(function (dependencies) {

                declare.safeMixin(this, dependencies);

                //pick a random direction and speed
                this.velocity.speed = Math.floor((Math.random() * 10) + 10);

                this.velocity.direction = (Math.random() - 0.5) * 16;

                //randomly decide if we're going to throw the ball left or right
                if ((Math.random() - 0.5) * 2 > 0) {
                    this.velocity.direction -= 180;
                }

this.velocity.direction = 0;

                return this;

            }.bind(this));

            return this.inherited(arguments);

        },

        step:  function (time) {

            var view = this.view;

            //our we at the bottom?
            if (view.frame.top + view.frame.height > view.vc.view.frame.height) {

                view.frame.top = view.vc.view.frame.height - view.frame.height;

                this.velocity.direction = -this.velocity.direction;

            }
            //off to the right
            else if (view.frame.left + view.frame.width >= view.vc.view.frame.width) {

                this.view.vc.emit('score', {
                    side: 'left', //the left side scores if it goes to the right
                    behavior: this,
                    ball: this.view
                });

            }
            //off to the left
            else if (view.frame.left <= 0) {

                view.vc.emit('score', {
                    side: 'right', //the right side scores if it goes to the left
                    behavior: this,
                    ball: this.view
                });

            }
            //off the top
            else if (view.frame.top < 0) {

                view.frame.top = view.vc.view.frame.top;

                this.velocity.direction = -this.velocity.direction;

            }

            return this.inherited(arguments);

        },

        onDidCollide: function (e) {

            var collisions = e.get('collisions'),
                paddleMidpoint,
                ballMidpoint,
                paddleHeight,
                reflectionMultiplier,
                reflectionLimiter = 75;

            _.each(collisions, function (collision) {

                var view = collision.view;

                if (view.isPaddle) {

                    //we're colliding with a paddle, now what?
                    //well, we need to determine which side of the paddle we're on.. top or bottom?
                    paddleMidpoint = {
                        //x: view.frame.left + (view.frame.width / 2) //we dont need x information for this use case
                        y: view.frame.top + (view.frame.height / 2)
                    };

                    ballMidpoint = {
                        //x: this.view.frame.left + (this.view.frame.width / 2) //we dont need x information for this use case
                        y: this.view.frame.top + (this.view.frame.height / 2)
                    };

                    paddleHeight = view.frame.height;

                    reflectionMultiplier = -(ballMidpoint.y - paddleMidpoint.y) / paddleHeight;

                    this.velocity.direction = e.get('angleOfReflection') + (reflectionLimiter /*how far we can deviate from actual reflection*/ * reflectionMultiplier);
                    this.lastPlayer         = view.player;

                    this.vc.emit('paddle-collision', {
                        paddle: view,
                        player: view.player
                    });

                }

            }, this);
        },

        setView: function (view) {

            view.addBehavior(this.velocity);
            view.addBehavior(this.collision);

            view.ballBehavior = this;
            view.on('collision').then(this.hitch('onDidCollide'));

            return this.inherited(arguments);

        }

    });

});