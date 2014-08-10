define(['altair/facades/declare',
        'liquidfire/modules/curium/behaviors/_Base',
        'altair/Lifecycle'
], function (declare,
             _Base,
             Lifecycle) {

    return declare([_Base, Lifecycle], {


        collision: null,
        enabled:   true,
        startup: function (options) {

            var _options = options || this.options || {};

            this.deferred = this.all({
                collision: _options.vc.forgeBehavior('Collision', {
                    group: _options.vc.collisionGroup()
                })
            }).then(function (dependencies) {

                declare.safeMixin(this, dependencies);

                return this;

            }.bind(this));


            return this.inherited(arguments);
        },

        setView: function (view) {

            view.addBehavior(this.collision);

            view.on('collision').then(this.hitch('onDidCollide'));

            return this.inherited(arguments);

        },

        apply: function (player) {

        },

        onDidCollide: function (e) {

            var view = e.get('view');
            console.log('did collide');
            this.view.removeFromSuperView();

//            if (this.enabled && view.lastPlayer) {
//
//                this.enabled = false;
//
//                this.view.vc.emit('power-up-collision', {
//                    ball: view,
//                    player: view.lastPlayer,
//                    powerUp: this,
//                    view: this.view
//                });
//
//            }

        }


    });

});