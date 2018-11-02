const { createSession } = require("iocane");

function encryptString(text, key) {
    return createSession().encrypt(text, key);
}

module.exports = {
    encryptString
};
