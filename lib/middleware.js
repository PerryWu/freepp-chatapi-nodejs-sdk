const raw = require('body-parser').raw;
const validateSignature = require('./validate-signature');

module.exports = function(configs) {
    if (!configs.appKey) {
        throw new Error("no appKey given");
    }
    const appKey = configs.appKey;

    return (req, res, next) => {
        const signature = req.headers["x-joinme-signature"];
        if (!signature) {
            next(new Error('no signature'));
            return;
        }

        const validate = (body) => {
            if (!validateSignature(body, appKey, signature)) {
                next(new Error('signature validation failed'));
                return;
            }
            const strBody = Buffer.isBuffer(body) ? body.toString() : body;

            try {
                req.body = JSON.parse(strBody);
                next();
            } catch (err) {
                next(new Error('body is not in json format'));
            }
        };

        if (typeof req.body === "string" || Buffer.isBuffer(req.body)) {
            return validate(req.body);
        }

        // if body is not parsed yet, parse it to a buffer
        raw({ type: "*/*" })(req, res, () => validate(req.body));

    }
}