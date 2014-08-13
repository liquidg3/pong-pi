define(['altair/facades/declare',
        'liquidfire/modules/curium/behaviors/_Base'
], function (declare,
             _Base) {

    return declare([_Base], {

        velocity:       null,
        collision:      null,
        lastPlayer:     null,

        startup: function () {

            this.velocity   = this.vc.forgeBehavior('Velocity');
            this.collision  = this.vc.forgeBehavior('Collision2', {
                group:          this.vc.collisionGroup(),
                calculate:      true,
                debug:          true
            });

            //pick a random direction and speed
            this.velocity.speed     = this.vc.ballSpeed + Math.ceil((Math.random() - 0.5) * 4);
            this.velocity.direction = (Math.random() - 0.5) * 45;

            //randomly decide if we're going to throw the ball left or right
            if ((Math.random() - 0.5) * 2 > 0) {
                this.velocity.direction -= 180;
            }
            
            return this;

        },

        step:  function (time) {

            var view = this.view;

            //our we at the bottom?
            if (view.frame.top + view.frame.height >= this.vc.playableRect.height) {

                view.frame.top = this.vc.playableRect.height - view.frame.height;

                this.velocity.direction = -this.velocity.direction;

            }
            //off to the right
            else if (view.frame.left + view.frame.width >= view.vc.playableRect.width) {

                this.view.vc.emit('score', {
                    side: 'left', //the left side scores if it goes to the right
                    behavior: this,
                    ball: this.view
                });

                this.view.hidden = true;

            }
            //off to the left
            else if (view.frame.left < view.vc.playableRect.left) {

                view.vc.emit('score', {
                    side: 'right', //the right side scores if it goes to the left
                    behavior: this,
                    ball: this.view
                });

                this.view.hidden = true;

            }
            //off the top
            else if (view.frame.top < view.vc.playableRect.top) {

                view.frame.top = this.vc.playableRect.top;

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
                reflectionLimiter = 75,
                reflectionDirection;

//console.log('Ball.onDidCollide collisions -----------');

            //_.each(collisions, function (collision) {
//console.log(collision.view);
//console.log('--------------');
//console.log(' ');
//console.log(' ');
                var collision = collisions[0];
                var view = collision.view;

                if (view.isPaddle) {

                    this.view.frame.top = this.lastFrame.top;//collision.point.y;
                    this.view.frame.left = this.lastFrame.left;//collision.point.x;

//console.log('ball to paddle collision');
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

                    //determine which direction to bounce the ball upon collision with a paddle.
                    if (this.view.frame.left < collision.view.frame.left) {
                        reflectionDirection = 180;
                        reflectionMultiplier = -(ballMidpoint.y - paddleMidpoint.y) / paddleHeight;
                    }

                    if ((this.view.frame.left + this.view.frame.width) > (collision.view.frame.left + collision.view.frame.width)) {
                        reflectionDirection = 0;
                        reflectionMultiplier = (ballMidpoint.y - paddleMidpoint.y) / paddleHeight;
                    }

                    this.velocity.direction = reflectionDirection + (reflectionLimiter /*how far we can deviate from actual reflection*/ * reflectionMultiplier);
                    this.lastPlayer         = view.player;

                    this.vc.emit('paddle-collision', {
                        paddle: view,
                        player: view.player
                    });

                }

            //}, this);
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