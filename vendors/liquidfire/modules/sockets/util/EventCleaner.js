define(['altair/facades/declare',
    'lodash'
], function (declare, _) {

    return declare(null, {

        maxDepth: 3,
        cleanEventData: function (data, depth) {

            if(!depth) {
                depth = 0;
            } else if(depth >= this.maxDepth) {
                return data.toString();
            }

            var clean = {};

            _.each(data, function (value, key) {

                if(_.isFunction(value)) {
                    //do nothing
                } else if(value.isInstanceOf) {
                    clean[key] = value.toString();
                } else if(_.isObject(value)) {
                    clean[key] = this.cleanEventData(value, depth ++);
                } else {
                    clean[key] = value;
                }

            }, this);

            return clean;
        }

    });

});