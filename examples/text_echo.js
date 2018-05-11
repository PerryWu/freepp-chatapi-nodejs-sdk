const express = require('express');
//const freepp = require('freepp-chatapi-nodejs-sdk');
const freepp = require('../lib');
const async = require('async');

const config = {
    accessToken: 'YOUR_CHANNEL_ACCESS_TOKEN',
    appKey: 'YOUR_APP_KEY',
};

const app = express();

app.post('/webhook', freepp.middleware(config), (req, res) => {
    console.log('Got message', req.body, req.headers);
    async.map(req.body.events, (event, cb) => {
        handleEvent(event, cb);
    }, (err, result) => {
        if (err) {
            return res.status(500).end();
        }
        res.end();
    })
});

// create FreePP SDK client
const client = freepp.Client(config);

// simple reply text function
const replyText = (token, texts, cb) => {
    texts = Array.isArray(texts) ? texts : [texts];
    return client.replyMessage(
        token,
        texts.map((text) => ({ type: 'Text', value: text })),
        cb
    );
};

function handleEvent(event, cb) {
    if (event.type !== 'Message' || event.message.type !== 'Text') {
        return cb(null);
    }
    return replyText(event.replyToken, event.message.value, cb);
}

app.listen(80);