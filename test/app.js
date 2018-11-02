const { createHost } = require("../source/host.js");

function getNewApp() {
    return createHost(null, "testing");
}

module.exports = {
    getNewApp
};
