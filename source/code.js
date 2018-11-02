const CIPHER_KEY_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz_-()&*%^#$!@~+=[]{};:,.<>?";
const CIPHER_KEY_LENGTH_MAX = 32;
const CIPHER_KEY_LENGTH_MIN = 24;
const CODE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateCipherKey() {
    const len = CIPHER_KEY_LENGTH_MIN + Math.floor(Math.random() * (CIPHER_KEY_LENGTH_MAX - CIPHER_KEY_LENGTH_MIN + 1));
    return generateRandomString(len, CIPHER_KEY_CHARACTERS);
}

function generateConnectCode() {
    return generateRandomString(6, CODE_CHARACTERS);
}

function generateRandomString(len, characters) {
    let output = "";
    for (let i = 0; i < len; i += 1) {
        output += characters[Math.floor(Math.random() * characters.length)];
    }
    return output;
}

module.exports = {
    generateCipherKey,
    generateConnectCode
};
