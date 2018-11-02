const { createSession } = require("iocane");

function decryptString(payload, key) {
    return createSession().decrypt(payload, key);
}

function encryptString(text, key) {
    return createSession().encrypt(text, key);
}

module.exports = {
    decryptString,
    encryptString
};
