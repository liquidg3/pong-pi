define(['altair/facades/declare',
        'liquidfire/modules/curium/controllers/ViewController'
], function (declare, ViewController) {

    return declare([ViewController], {

        /**
         * Every controller uses an altair/StateMachine for state management
         */
        states:  ['splash', 'instructions'],

        onStateMachineWillEnterSplash: function (e) {

            //every view controller has a view property that represents its main view
            this.view.backgroundColor = '#d8015e';

            //this.all allows many async operations to take place at once
            //i'll use it to forge some stuff
            return this.all({
                logo: this.forgeView('ImageView', {
                    backgroundColor: 'transparent', //default backgroundColor is #fff
                    image: 'assets/images/logo.png',
                    alpha: 0 //i wanna fade this badboy in
                })
            }).then(function (objects) {

                var logo = objects.logo;

                //now that the logo view has been forged, it is sized to match the image
                //i'll center it on screen (my view will default to the canvas size)
                logo.frame.left = this.view.frame.width/2 - logo.frame.width/2;
                logo.frame.top  = this.view.frame.height/2 - logo.frame.height/2;

                this.view.addSubView(objects.logo);

                return this.delay(2000, logo); //delay for 2 seconds, but pass through the logo

            }.bind(this)).then(function (logo) {

                return logo.animate('alpha', 1, 500); //animating is easy, you can pass any property and the ending value

            }.bind(this)).then(function (logo) {

                //pass logo through to next stage of splash state
                return { logo: logo };

            }.bind(this)).otherwise(function (err) {
                console.error(err.stack);
            });

        },

        //i just want to keep the logo hanging for a bit
        onStateMachineDidEnterSplash: function (e) {

            //this was passed from the last stage in the Splash state
            var logo = e.get('logo');

            //lets keep the logo up for a sec
            return this.delay(1000, logo).then(function (logo) { //wait for 1 second
                return { logo: logo };
            });

        },

        //cleanup on exit
        onStateMachineDidExitSplash: function (e) {

            var logo = e.get('logo');

            return logo.animate('alpha', 0, 500).then(function () {  //fade back out
                this.view.removeAllSubViews(); //cleanup for next state
            }.bind(this));

        }




    });

});