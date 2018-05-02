const request = require('request');
const async = require('async');
const URL = require('./urls');

function client(config) {

    if (!(this instanceof client)) { return new client(config); }

    if (typeof(config) != 'object' || !config.agid || !config.accessToken) {
        throw (new Error('Got wrong config format. agid and accessToken are required'));
    }

    var agid = config.agid;
    var accessToken = config.accessToken;

    function toArray(messages) {
        return Array.isArray(messages) ? messages : [messages];
    }

    function authHeader() {
        return { Authorization: "Bearer " + accessToken };
    }

    function post(url, body, cb) {
    	console.log(`post ${url} with body ${JSON.stringify(body)}`);
        request({
            url: url,
            method: 'post',
            body: body,
            json: true,
            headers: authHeader(),
        }, (err, rsp, body) => {
            if (err)
                return cb(err);

            if (rsp.statusCode != 200) {
                return cb(new Error('Not 200 ok'));
            }
            return cb(null, body);
        });
    }

    function get(url, cb) {
    	console.log(`get ${url}`);
        request({
            url: url,
            method: 'get',
            json: true,
            headers: authHeader(),
        }, (err, rsp, body) => {
            if (err)
                return cb(err);

            if (rsp.statusCode != 200) {
                return cb(new Error('Not 200 ok'));
            }
            return cb(null, body);
        });
    }

    function dumpUrls() {
    	for(var i in URL) {
    		var url = typeof(URL[i]) == "function"?URL[i]("{param}"):URL[i];
    		console.log(`${i}:\n  ${url}`);
    	}
    }
    //dumpUrls();

    this.pushMessage = function(dest, messages, cb) {
        var body = {
            messages: toArray(messages),
        };

        if (!dest.to)
            return cb(new Error('Missing to'));
        body.to = dest.to;

        if (dest.via)
            body.via = dest.via;
        if (dest.only)
            body.only = dest.only;

        return post(URL.push, body, cb);
    }

    this.replyMessage = function(replyToken, messages, cb) {
        return post(URL.reply, {
            messages: toArray(messages),
            replyToken: replyToken,
        }, cb);
    }

    this.getProfile = function(pid, cb) {
        return get(URL.profile(pid), cb);
    }

    this.leaveGroup = function(gid, cb) {
        return get(URL.leaveGroup(gid), cb);
    }

    this.setMenu = function(menuBody, cb) {
        return post(URL.menu, menuBody, cb);
    }
}


module.exports = client;