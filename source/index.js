const { createHost } = require("./host.js");
const { generateCipherKey } = require("./code.js");

/**
 * @module SecureFileHost
 */

/**
 * @typedef {Host} HostWithKey
 * @property {String} key - The encryption key used on the host
 */

/**
 * Start a new file host
 * @param {Number} port The port to listen on
 * @param {String=} key The encryption key for encrypting traffic between
 *  the host and the client. If not specified a random key will be
 *  generated.
 * @returns {HostWithKey} A Host instance with an encryption key
 * @memberof module:SecureFileHost
 */
function startFileHost(port, key = generateCipherKey()) {
    const host = createHost(port, key);
    return Object.assign({
        key
    }, host);
}

module.exports = {
    startFileHost
};
