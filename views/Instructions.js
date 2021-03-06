define(['altair/facades/declare',
    'liquidfire/modules/curium/views/View'
], function (declare,
             View) {

    return declare([View], {

        top:     null,
        backgroundColor: 'rgba(0,0,0,0.5)',
        startup: function (options) {

            var _options    = options || this.options || {};

            this.top         = _options.vc.forgeView('Label', {
                text:       'to play, visit',
                font:       '15px sansarif',
                textColor:  '#fff',
                textAlign:  'center',
                backgroundColor: 'transparent'
            });

            this.ip  = _options.vc.forgeView('Label', {
                text:       'http://' + _options.vc.app.ip,
                font:       '25px sansarif',
                textColor:  '#fff',
                textAlign:  'center',
                backgroundColor: 'transparent'
            });

            this.bottom =  _options.vc.forgeView('Label', {
                text:       'on your phone\'s web browser',
                font:       '15px sansarif',
                textColor:  '#fff',
                textAlign:  'center',
                backgroundColor: 'transparent'
            });

            this.addSubView(this.top);
            this.addSubView(this.ip);
            this.addSubView(this.bottom);

            return this.inherited(arguments);
        },


        render: function (context, times) {

            var frame = this.frame;

            //top label
            this.top.frame = {
                left:   0,
                top:    this.frame.height * 0.35,
                width:  frame.width,
                height: 30
            };

            //our ip
            this.ip.frame = {
                left:   0,
                top:    this.top.frame.top + this.top.frame.height,
                width:  frame.width,
                height: 50
            };

            //your phone's web browser
            this.bottom.frame = {
                left:   0,
                top:    this.ip.frame.top + this.ip.frame.height,
                width:  frame.width,
                height: 20
            };


            return this.inherited(arguments);
        }

    });

});