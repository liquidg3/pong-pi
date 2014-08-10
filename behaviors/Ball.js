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

                return this;

            }.bind(this));

            return this.inherited(arguments);

        },

        step:  function (time) {

            var view = this.view;

            //our we at the bottom?
            if (view.frame.top + view.frame.height >= view.vc.view.frame.height) {

                this.velocity.ySpeed *= -1;

            }
            //off to the right
            else if (view.frame.left + view.frame.width >= view.vc.view.frame.width) {

                this.view.vc.emit('score', {
                    side: 'right',
                    behavior: this,
                    ball: this.view
                });

            }
            //off to the left
            else if (view.frame.left <= 0) {

                view.vc.emit('score', {
                    side: 'left',
                    behavior: this,
                    ball: this.view
                });

            }
            //off the top
            else if (view.frame.top <= 0) {
                this.velocity.ySpeed *= -1;
            }

            return this.inherited(arguments);

        },

        onDidCollide: function (e) {

            var view = e.get('view');

            this.velocity.direction = e.get('angleOfReflection') + ((Math.random() - 0.5) * 16);
        },

        setView: function (view) {

            view.addBehavior(this.velocity);
            view.addBehavior(this.collision);

            view.on('collision').then(this.hitch('onDidCollide'));

            return this.inherited(arguments);

        }

    });

});