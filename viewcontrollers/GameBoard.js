define(['altair/facades/declare',
        'liquidfire/modules/curium/controllers/ViewController',
        'altair/facades/mixin'
], function (declare, ViewController, mixin) {

    return declare([ViewController], {

        /**
         * Every controller uses an altair/StateMachine for state management
         */
        states:  ['game'],
        colors:  [[216, 203, 1], [0, 173, 61], [216, 1, 94]],
        leftPaddle: null,
        rightPaddle: null,
        paddleWidth: 10,
        paddleHeight: 100,
        currentColor: null,

        startup: function (options) {
            return this.inherited(arguments).then(function () {

                this.currentColor = this.colors[options.startColor || 0];
                this.view.backgroundColor = 'rgba(' + this.currentColor.r + ', ' + this.currentColor.g + ', ' + this.currentColor.b + ', 1)';

                return this;
                
            }.bind(this));
        },

        //use the "WillEnter" to load your resources; views, sounds, etc.
        onStateMachineWillEnterGame: function (e) {


            this.animateBackgroundToNextColor();

            return this.all({
                leftPaddle: this.forgePaddle({
                    frame: {
                        left: 10,
                        top:  this.view.frame.height/2 - this.paddleHeight/2
                    }
                }),
                rightPaddle: this.forgePaddle({
                    frame: {
                        left: this.view.frame.width - this.paddleWidth - 10,
                        top:  this.view.frame.height/2 - this.paddleHeight/2
                    }
                })
            });


            return this.delay(100000);
        },

        onStateMachineDidEnterGame: function (e) {

            this.leftPaddle = e.get('leftPaddle');
            this.rightPaddle = e.get('rightPaddle');

            this.view.addSubView(this.leftPaddle);
            this.view.addSubView(this.rightPaddle);

        },

        forgePaddle: function (options) {

            var _options = mixin({
                backgroundColor: '#fff',
                frame: {
                }
            }, options || {});

            _options.frame.width = this.paddleWidth;
            _options.frame.height = this.paddleHeight;

            return this.forgeView(_options);

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

            });


        }





    });

});