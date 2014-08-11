define(['altair/facades/declare',
        'liquidfire/modules/curium/behaviors/_Base'
], function (declare,
             _Base) {

    return declare([_Base], {

        player: null,
        top:    -999,
        enableInertia: true,
        _inertia: 0,
        _lastDirection: 0,
        _idle: false,

        constructor: function (options) {

            this.assert(options && options.player, 'you must pass options and a player');

            options.player.connection.on('scroll', this.hitch('onScroll'));

        },

        step:  function (time) {
            this.inherited(arguments);

            var lastPosition,
                thisPosition,
                newPosition,
                damper = 3;

            if (this._idle) {
                this.top += this._inertia;
            }

            this._inertia = this._inertia/damper;


            if (this.top > -999) {
                if (this.top < 0) this.top = 0;
                if (this.top+this.view.frame.height > this.vc.view.frame.height) this.top = this.vc.view.frame.height-this.view.frame.height;

                this.view.frame.top = this.top;
            }

            this._idle = true;
            return this;

        },

        onScroll: function (data) {
            var max = this.vc.view.frame.height - this.view.frame.height,
                lastPosition,
                thisPosition,
                direction,
                distance,
                inertiaThreshold = 30;

            this.top =  max - data.distance * max;

            if (this.enableInertia) {
                lastPosition = {
                    //x: this.lastFrame.left,
                    y: this.lastFrame.top
                };

                thisPosition = {
                    //x: this.view.frame.left,
                    y: this.view.frame.top
                };

                distance = (lastPosition.y - thisPosition.y);
                direction = distance > 0 ? 1 : -1;

                //without this, when a player tells the paddle to go up, it continues down for a few frames
                if (this._lastDirection !== direction) {
                    this._inertia = 0;
                }

                this._inertia = -distance;

                if(this._inertia > inertiaThreshold) this._inertia = inertiaThreshold;
                if(this._inertia < -inertiaThreshold) this._inertia = -inertiaThreshold;

                this._lastDirection = direction;
                this._idle = false;
            }

        }

    });

});