const { createHost } = require("./host.js");
const { generateCipherKey } = require("./code.js");

function startFileHost(port, key = generateCipherKey()) {
    const  = createHost(port, key);
    return Object.assign({
        key
    }, host);
}

module.exports = {
    startFileHost
};
