define(['altair/facades/declare',
        'liquidfire/modules/curium/controllers/ViewController'
], function (declare, ViewController) {

    return declare([ViewController], {

        /**
         * Every controller uses an altair/StateMachine for state management
         */
        states:  ['splash', 'instructions'],
        selectedColor: Math.floor(Math.random() * 3),

        //use the "WillEnter" to load your resources; views, sounds, etc.
        onStateMachineWillEnterSplash: function (e) {

            //every view controller has a view property that represents its main view
            //i want it to be one of our colors
            this.view.backgroundColor = ['#d8cb01', '#00ad3d', '#d8015e'][this.selectedColor];

            //this.all allows many async operations to take place at once
            //i'll use it to forge some stuff
            return this.all({
                logo: this.forgeView('ImageView', {
                    backgroundColor: 'transparent', //default backgroundColor is #fff
                    image: 'assets/images/logo.png',
                    alpha: 0 //i wanna fade this badboy in later
                })
            }).otherwise(function (err) {
                console.error(err.stack);
            });

        },

        //now everything is ready for the splash state
        onStateMachineDidEnterSplash: function (e) {

            //this was passed from the last stage
            var logo = e.get('logo');

            //i'll center it on screen (my view will default to the canvas size)
            logo.frame.left = this.view.frame.width/2 - logo.frame.width/2;
            logo.frame.top  = this.view.frame.height/2 - logo.frame.height/2;

            //add it to view
            this.view.addSubView(logo);

            //delay for 2 seconds so the terminal finishes outputting (outputting text to the terminal slows UI)
            return this.delay(2000, logo).then(function (logo) {

                return logo.animate('alpha', 1, 500); //animating is easy, you can pass any property and the ending value

            }).then(function (logo) {

                //stay visible for a sec
                return this.delay(1000, { logo: logo});

            }.bind(this));


        },

        //fade out and cleanup on exit
        onStateMachineDidExitSplash: function (e) {

            var logo = e.get('logo');

            return logo.animate('alpha', 0, 500).then(function () {  //fade back out

//                this.view.removeAllSubViews(); //cleanup for next state

                this.app.presentViewController('GameBoard', {
                    startColor: this.selectedColor
                });

            }.bind(this));

        }




    });

});