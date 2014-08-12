;(function (altair) {

    function decodeQueryString(string) {

        var query = string,
            vars = query.split('&'),
            results = {};

        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');
            results[pair[0]] = pair[1];
        }

        return results;
    }

    //read config
    var scripts     = document.getElementsByTagName('script'),
        index       = scripts.length - 1,
        script      = scripts[index],
        options     = decodeQueryString(script.src.split('?')[1]);

    if(!options || !altair.sockets || !SockJS) {
        throw new Error('The SockJS file cannot be manually include. Use the liquidfire:Sockets module to use it properly.');
    }


    var Adapter = function (options) {

        this._url = options.url;
        this._client = null;

    };

    //connect to socket using adapter
    Adapter.prototype.connect = function () {

        this._client = new SockJS(this._url);
        this._client.onmessage = this.onMessage.bind(this);

    };

    Adapter.prototype.send = function (message) {
        this._client.send(message);
    };

    Adapter.prototype.emit = function (name, data) {
        var message = ';ALTAIR_EVENT name: ' + name + ', data: '. JSON.stringify(data);
        this._client.emit(message);

    };

    Adapter.prototype.onMessage = function (data) {
        console.log('on message', data);
    };

    //create adapter and pass it to sockets.
    altair.sockets.setAdapter(new Adapter(options));

    //start the server... dick move?
    altair.sockets.connect();


})(window.altair);