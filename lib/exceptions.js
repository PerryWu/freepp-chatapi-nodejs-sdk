
module.exports.HTTPError = function (message, statusCode, statusMessage) {
    this.name = 'HTTPError';
    this.message = message;
    this.statusCode = statusCode;
    this.statusMessage = statusMessage;
    this.stack = (new Error()).stack;
}