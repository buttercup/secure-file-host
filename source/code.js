const CODE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateConnectCode() {
    let output = "";
    for (let i = 0; i < 6; i += 1) {
        output += CODE_CHARACTERS[Math.floor(Math.random() * CODE_CHARACTERS.length)];
    }
    return output;
}

module.exports = {
    generateConnectCode
};
