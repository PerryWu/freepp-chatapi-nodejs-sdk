# freepp-chatapi-nodejs-sdk

Node.js SDK for FreePP Chat API

## Getting Started

### install
Using [npm](https://www.npmjs.com/):

``` bash
$ npm install freepp-chatapi-nodejs-sdk
```

## Samples
The full examples with comments can be found in examples folder.
For the specifications of API, please refer to API Reference.

``` bash
$ git clone https://github.com/perrywu/freepp-chatapi-nodejs-sdk
$ cd freepp-chatapi-nodejs-sdk
$ npm install
$ node examples/all_type_echo.js
```

## Basic Usage

### Include the library
```
const freepp = require('freepp-chatapi-nodejs-sdk');
```

### Configuration
For the usage of webhook and client, freepp access token and appkey are needed. About issuing the token and appkey, please refer to Getting started with the chat API.
```
const config = {
    accessToken: 'YOUR_CHANNEL_ACCESS_TOKEN',
    agid: 'YOUR_AGENT_ID',
    appKey: 'YOUR_APP_KEY',
};

const client = freepp.Client(config);
freepp.middleware(config);
```

### Usage
```
const express = require('express');
const freepp = require('freepp-chatapi-nodejs-sdk');
const async = require('async');

const config = {
    accessToken: 'YOUR_CHANNEL_ACCESS_TOKEN',
    agid: 'YOUR_AGENT_ID',
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
```

## Guide

### Webhook
A webhook server for FreePP chat API is just a plain HTTP(S) server. When there is a observable user event, an HTTP request will be sent to a pre-configured webhook server.

About configuration of webhook itself, please refer to Webhook of the official document.

What a webhook server should do
* Signature validation
* Webhook event object parsing

***Signature validation***  is checking if a request is actually sent from real FreePP servers, not a fraud. The validation is conducted by checking the x-joinme-signature header and request body. There is a validateSignature() function to do this.

***Webhook event object parsing*** is literally parsing webhook event objects, which contains information of each webhook event. The objects are provided as request body in JSON format, so any body parser will work here. For interal object types in this SDK, please refer to Message and event objects.

There is a function to generate a connect middleware, middleware(), to conduct both of them. If your server can make use of connect middlewares, such as Express, using the middleware is a recommended way to build a webhook server.

### Build a webhook server with Express
Express is a minimal web framework for Node.js, which is widely used in Node.js communities. You can surely build a webhook server with any web framework, but we use Express as an example here for its popularity.

We skip the detailed guide for Express. If more information is needed about Express, please refer to its documentation.

Here is an example of an HTTP server built with Express.
```
const express = require('express')

const app = express()

app.post('/webhook', (req, res) => {
  res.json({})
})

app.listen(8080)
```
The server above listens to 8080 and will response with an empty object for POST /webhook. We will add webhook functionality to this server.


```
const express = require('express')
const freepp = require('freepp-chatapi-nodejs-sdk');

const app = express()

const config = {
    accessToken: 'YOUR_CHANNEL_ACCESS_TOKEN',
    agid: 'YOUR_AGENT_ID',
    appKey: 'YOUR_APP_KEY',
};

app.post('/webhook', freepp.middleware(config), (req, res) => {
  res.json(req.body.events) // req.body will be webhook event object
})

app.listen(8080)
```
We have imported middleware from the package and make the Express app to use the middleware. The middlware validates the request and parses webhook event object. It embeds body-parser and parses them to objects. If you have a reason to use another body-parser separately for other routes, please keep in mind the followings.

### Do not use the webhook middleware() for other usual routes
// don't
```
app.use(freepp.middleware(config))
```

// do
```
app.use('/webhook', freepp.middleware(config))
```
The middleware will throw an exception when the x-joinme-signature header is not set. If you want to handle usual user requests, the middleware shouldn't be used for them.

### Do not use another body-parser before the webhook middleware()
// don't
```
app.use(bodyParser.json())
app.use('/webhook', middleware(config))
```

// do
```
app.use('/webhook', middleware(config))
app.use(bodyParser.json())
```

If another body parser already parsed a request's body, the webhook middleware cannot access to the raw body of the request. The raw body should be retrieved for signature validation.

However, there are environments where req.body is pre-parsed, such as Firebase Cloud Functions. If it parses the body into string or buffer, the middleware will use the body as it is and work just fine. If the pre-parsed body is an object, the webhook middleware will fail to work. In the case, please use validateSignature() manually with raw body.

### HTTPS
The webhook URL should have HTTPS protocol. There are several ways to build an HTTPS server. For example, here is a documentation of making Express work with HTTPS. You can also set HTTPS in web servers like NGINX. This guide will not cover HTTPS configuration, but do not forget to set HTTPS beforehand.

For development and test usages, ngrok works perfectly.

## Client
Client is to send messages, get user or content information, or leave chats. A client instance provides functions for messaging APIs, so that you do not need to worry about HTTP requests and can focus on data. For type signatures of the methods, please refer to its API reference.

### Create a client
```
const freepp = require('freepp-chatapi-nodejs-sdk');
const config = {
    accessToken: 'YOUR_CHANNEL_ACCESS_TOKEN',
    agid: 'YOUR_AGENT_ID',
    appKey: 'YOUR_APP_KEY',
};
const client = freepp.Client(config);
```
And now you can call client functions as usual:

```
client.pushMessage({to: pid}, { type: 'text', text: 'hello, world' });
```

## API Reference

### Client

***client.pushMessage(dest, messages, cb)***
Send messages to specific destination.
```
dest
(object) target to send
dest.to
(string) FreePP id, please refer to ChatAPI docunemt
dest.via
(string) FreePP id, please refer to ChatAPI docunemt
dest.only
(string) FreePP id, please refer to ChatAPI docunemt
messages
(array of object) message body, please refer to ChatAPI document
cb
(function) callback
```

***client.replyMessage(replyToken, messages, cb)***
Reply a message from webhook using replyToken
```
replyToken
(string) replyToken from webhook event
messages
(array of object) message body, please refer to ChatAPI document
cb
(function) callback
```

***client.getProfile(pid, cb)***
Get a profile infomation
```
pid
(string) FreePP profile id
cb
(function) callback
```

***client.leaveGroup(gid, cb)***
Leave a group 
```
gid
(string) FreePP group id
cb
(function) callback
```

***client.setMenu(menuBody, cb)***
Setup menu
```
menuBody
(object) Please refer to ChatAPI document
cb
(function) callback
```

## License

[Apache License Version 2.0](LICENSE)