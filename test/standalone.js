const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const { startFileHost } = require("../source/index.js");

const KEYPATH = path.resolve(__dirname, "../standalone.key");
const PORT = 12821;

function error(...args) {
    console.log(chalk.red("[STANDALONE]"), ...args);
}
function log(...args) {
    console.log(chalk.green("[STANDALONE]"), ...args);
}

log("Starting standalone server");
let key,
    fileWasRead = false;
try {
    key = fs.readFileSync(KEYPATH, "utf8");
    fileWasRead = true;
} catch (err) {
    error(`No key at path: ${KEYPATH}`);
}
if (!key && fileWasRead) {
    throw new Error("Key from key-file was invalid");
}

const host = startFileHost(PORT, key);
if (!host.key) {
    throw new Error("Key from host was invalid");
}
fs.writeFileSync(KEYPATH, host.key);
host.emitter.on("codeReady", info => {
    log(`Code ready: ${info.code}`);
});
host.emitter.on("connected", () => {
    log("Client connected with code");
});
host.emitter.on("connectionFailed", () => {
    error("Client connection failed");
});
host.emitter.on("connectionAvailabilityChanged", info => {
    log(`Connection availability changed: ${info.available ? "Available" : "Unavailable"}`);
});
log(`Started server on port ${PORT} with key: ${host.key}`);

process.on("SIGINT", function() {
    log("Interrupt request detected");
    host.stop();
    process.exit(0);
});
