define(['altair/facades/declare',
        'liquidfire/modules/curium/behaviors/_Base',
        'altair/Lifecycle'
], function (declare,
             _Base,
             Lifecycle) {

    return declare([_Base, Lifecycle], {

        startDirection: -1, //1 === right, -1 === left
        velocity:       null,
        collusion:      null,
        startup: function (options) {

            this.deferred = this.all({
                velocity:   options.vc.forgeBehavior('Velocity'),
                collision:  options.vc.forgeBehavior('Collision', {
                    group:  options.vc.collisionGroup()
                })
            }).then(function (dependencies) {

                declare.safeMixin(this, dependencies);

                //pick a random x/y velocity
                this.velocity.xSpeed = Math.floor((Math.random() * 8) + 5);
                this.velocity.ySpeed = Math.floor((Math.random() * 8) + 5);

                //if x or y are even, lets reverse them
                if (this.velocity.xSpeed % 2 === 0) {
                    this.velocity.xSpeed *= -1;
                }

                if (this.velocity.ySpeed % 2 === 0) {
                    this.velocity.ySpeed *= -1;
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
            this.velocity.xSpeed *= -1;

        },

        setView: function (view) {

            view.addBehavior(this.velocity);
            view.addBehavior(this.collision);

            view.on('collision').then(this.hitch('onDidCollide'));

            return this.inherited(arguments);

        }

    });

});