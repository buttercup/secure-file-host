const { createHost, getHost } = require("./host.js");

function startFileHost(port) {
    createHost(port);
    const { emitter } = getHost();
    return emitter;
}

module.exports = {
    startFileHost
};
