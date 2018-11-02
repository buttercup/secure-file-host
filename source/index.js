const { createHost, getHost } = require("./host.js");
const { generateCipherKey } = require("./code.js");

function startFileHost(port, key = generateCipherKey()) {
    createHost(port, key);
    const { emitter } = getHost();
    return {
        emitter,
        key
    };
}

module.exports = {
    startFileHost
};
