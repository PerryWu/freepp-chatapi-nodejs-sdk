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
    }, (err, results) => {
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
    switch (event.type) {
        case 'Message':
            const message = event.message;
            switch (message.type) {
                case 'Text':
                    return handleText(message, event.replyToken, event.source, cb);
                case 'Image':
                    return handleImage(message, event.replyToken, cb);
                case 'Video':
                    return handleVideo(message, event.replyToken, cb);
                case 'Audio':
                    return handleAudio(message, event.replyToken, cb);
                case 'AnyFile':
                    return handleAnyFile(message, event.replyToken, cb);
                case 'Sticker':
                    return handleSticker(message, event.replyToken, cb);
                default:
                    return cb(new Error(`Unknown message: ${JSON.stringify(message)}`));
            }

        case 'Follow':
            return replyText(event.replyToken, 'Got followed event. ${JSON.stringify(event)}', cb);

        case 'Unfollow':
            console.log(`Got unfollowed event. ${JSON.stringify(event)}`);
            return cb(null);

        case 'Join':
            return replyText(event.replyToken, `Got joined event. ${JSON.stringify(event)}`, cb);

        case 'Leave':
            console.log(`Got left event. ${JSON.stringify(event)}`);
            return cb(null);

        case 'Postback':
            return replyText(event.replyToken, `Got postback event: ${JSON.stringify(event)}`, cb);

        default:
            return cb(new Error(`Got unknown event: ${JSON.stringify(event)}`));
    }
}

/**
 * Handle incoming text message. message has exactly following words will have its responsive actions.
 * "profile": Display user's basic information getting from ChatAPI
 * "buttons": Display a button template chat UI
 * "confirm": Display a confirm template chat UI
 * "bye": If agent is in group chat, agent will leave group. Otherwise, just a message to user.
 * "no_menu"
 */
function handleText(message, replyToken, source, cb) {
    switch (message.value.toLowerCase()) {
        case 'push':
            return client.pushMessage({ to: source.pid }, { type: 'Text', value: 'This message uses PUSH api' }, cb);
        case 'profile':
            if (source.pid) {
                return async.waterfall([cb => {
                    client.getProfile(source.pid, cb)
                }, (profile, cb) => {
                    /*
                    profile
                    {
                        "name": "Joinme Test",
                        "pid": "Uxxxxxxxxxxxxxx...",
                        "avatar": "https://abc.com/...",
                        "locale": "zh_TW"
                    }
                     */
                    replyText(
                        replyToken, [
                            `Display name: ${profile.name}, Pid: ${profile.pid}, Locale: ${profile.locale}`,
                        ], cb
                    )
                }], cb);
            } else {
                return replyText(replyToken, 'Bot can\'t use profile API without user ID', cb);
            }
        case 'buttons':
            return client.replyMessage(
                replyToken, {
                    type: "Template",
                    value: "this is a buttons template",
                    template: {
                        type: "Buttons",
                        image: "https://example.com/bot/images/image.jpg",
                        title: "Menu",
                        text: "Please select",
                        actions: [{
                                type: "Message",
                                label: "Message test",
                                text: "Hello!",
                            },
                            {
                                type: "Postback",
                                label: "Postback test",
                                data: "action=add&itemid=123",
                            },
                            {
                                type: "Uri",
                                label: "Uri test",
                                uri: "https://www.google.com",
                            }
                        ]
                    }
                }, cb
            );
        case 'confirm':
            return client.replyMessage(
                replyToken, {
                    type: "Template",
                    value: "this is a confirm template",
                    template: {
                        type: "Confirm",
                        text: "Are you sure?",
                        actions: [{
                                type: "Message",
                                label: "Yes",
                                text: "yes"
                            },
                            {
                                type: "Message",
                                label: "No",
                                text: "no"
                            }
                        ]
                    }
                },
                cb
            )
        case 'bye':
            if (source.gid) {
                return async.series([cb => {
                    replyText(replyToken, 'Leaving group', cb);
                }, cb => {
                    client.leaveGroup(source.gid, cb);
                }], cb);
            } else {
                return replyText(replyToken, 'Bot can\'t leave from without having gid', cb);
            }
        case 'no menu':
            return async.series([cb => {
                replyText(replyToken, 'Set menu to empty', cb);
            }, cb => {
                client.setMenu({
                    locale: 'zh_TW',
                    menu: [],
                }, cb)
            }], cb)
        case 'menu':
            return async.series([cb => {
                replyText(replyToken, 'Set menu', cb);
            }, cb => {
                client.setMenu({
                    locale: 'zh_TW',
                    menu: [{
                        type: "Menu",
                        title: "網址",
                        actions: [{
                                type: "Uri",
                                label: "Google",
                                uri: "https://www.google.com"
                            }, {
                                type: "Uri",
                                label: "Yahoo",
                                uri: "https://www.yahoo.com"
                            }, {
                                type: "Uri",
                                label: "PCHOME",
                                uri: "https://www.pchome.com.tw"
                            },
                            {
                                type: "Uri",
                                label: "Facebook",
                                uri: "https://www.facebook.com"
                            },
                        ]
                    }, {
                        type: "Menu",
                        title: "Demo",
                        actions: [{
                            type: "Message",
                            label: "Message",
                            text: "This message is from menu"
                        }, {
                            type: "Postback",
                            label: "Postback",
                            data: 'This postback is from menu'
                        }]
                    }]
                }, cb)
            }], cb)
            return;
        default:
            console.log(`Echo message to ${replyToken}: ${message.value}`);
            return replyText(replyToken, message.value, cb);
    }
}

function handleImage(message, replyToken, cb) {
    // We got image message and just reply the message back
    console.log(`Got image message. ${JSON.stringify(message)}`);
    return client.replyMessage(replyToken, message, cb);
}

function handleVideo(message, replyToken, cb) {
    // We got video message and just reply the message back
    console.log(`Got video message. ${JSON.stringify(message)}`);
    return client.replyMessage(replyToken, message, cb);
}

function handleAudio(message, replyToken, cb) {
    // We got audio message and just reply the message back
    console.log(`Got audio message. ${JSON.stringify(message)}`);
    return client.replyMessage(replyToken, message, cb);
}

function handleAnyFile(message, replyToken, cb) {
    // We got anyfile message and just reply the message back
    console.log(`Got anyfile message. ${JSON.stringify(message)}`);
    return client.replyMessage(replyToken, message, cb);
}

function handleSticker(message, replyToken, cb) {
    // We got sticjer message and just reply the message back
    console.log(`Got sticjer message. ${JSON.stringify(message)}`);
    return client.replyMessage(replyToken, message, cb);
}

app.listen(80);