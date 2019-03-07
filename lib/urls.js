const qs = require("querystring");

const baseURL = process.env.API_BASE_URL || "https://pro20.freepp.com/bot/v1";

const apiURL = (path, query) =>
    baseURL + path + (query ? `?${qs.stringify(query)}` : "");

module.exports = {
    reply: apiURL("/message/reply"),
    push: apiURL("/message/push"),
    profile: (pid) => apiURL(`/profile/${pid}/get`),
    leaveGroup: (gid) => apiURL(`/group/${gid}/leave`),
    menu: apiURL("/menu/set"),
}
