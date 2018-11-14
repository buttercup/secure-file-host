const EventEmitter = require("eventemitter3");
const express = require("express");
const bodyParser = require("body-parser");
const pkgInfo = require("../package.json");
const { generateConnectCode } = require("./code.js");
const { decryptString, encryptString } = require("./crypto.js");
const { getDirectoryContents, getFileContents, getHomeDirectory, putFileContents } = require("./filesystem.js");

const RESET_DELAY = 15000;
const SHOW_DURATION = 15000;

/**
 * Host instance
 * @typedef {Object} Host
 * @property {Object} app - ExpressJS application instance
 * @property {Object} emitter - Event emitter instance
 * @property {Object|null} server - ExpressJS server instance
 * @property {Function=} stop - Method to stop the host from serving
 * @property {Function} cancel - Method to cancel the current connection attempt
 */

/**
 * Configure a host instance
 * @param {Host} host The host instance
 * @param {String} key The encryption key
 * @private
 */
function configureHost(host, key) {
    const { app, emitter } = host;
    let connectCode = null,
        busy = false;
    host._timer = null;
    host.cancel = () => {
        clearTimeout(host._timer);
        connectCode = null;
        busy = false;
        emitter.emit("connectionAvailabilityChanged", { available: true });
    };
    const timerReset = () => {
        clearTimeout(host._timer);
        connectCode = null;
        busy = true;
        emitter.emit("connectionFailed");
        emitter.emit("connectionAvailabilityChanged", { available: false });
        host._timer = setTimeout(() => {
            busy = false;
            emitter.emit("connectionAvailabilityChanged", { available: true });
        }, RESET_DELAY);
    };
    app.disable("x-powered-by");
    app.use(bodyParser.json());
    app.use((req, res, next) => {
        res.set("Content-Type", "application/json");
        res.set("Server", `Buttercup/SecureFileHost/${pkgInfo.version}`);
        next();
    });
    app.get("/", (req, res) => {
        res.send(JSON.stringify({
            type: "secure-file-host",
            status: "ok",
            ready: !busy
        }));
    });
    app.get("/connect", (req, res) => {
        if (connectCode || busy) {
            res
                .set("Content-Type", "text/plain")
                .status(503)
                .send("Unavailable");
            return;
        }
        connectCode = generateConnectCode();
        emitter.emit("codeReady", {
            code: connectCode
        });
        busy = true;
        res.send(JSON.stringify({
            status: "ok"
        }));
    });
    app.get("/connect/:code", (req, res) => {
        const { code } = req.params;
        if (connectCode && busy) {
            if (connectCode !== code) {
                timerReset();
                res
                    .set("Content-Type", "text/plain")
                    .status(401)
                    .send("Unauthorized");
                return;
            }
            // Success
            const responseKey = connectCode;
            connectCode = null;
            busy = false;
            emitter.emit("connected");
            encryptString(key, responseKey)
                .then(encrypted => {
                    res.send(JSON.stringify({
                        status: "ok",
                        payload: encrypted
                    }));
                })
                .catch(err => {
                    console.error(err);
                    res
                        .set("Content-Type", "text/plain")
                        .status(500)
                        .send("Internal Server Error");
                });
            return;
        } else if (busy && !connectCode) {
            timerReset();
            res
                .set("Content-Type", "text/plain")
                .status(503)
                .send("Unavailable");
            return;
        }
        timerReset();
        res
            .set("Content-Type", "text/plain")
            .status(400)
            .send("Bad Request");
        return;
    });
    app.post("/get/directory", (req, res) => {
        const { payload } = req.body;
        decryptString(payload, key)
            .then(dir => {
                return getDirectoryContents(dir)
                    .then(items => {
                        return encryptString(JSON.stringify(items), key);
                    })
                    .then(payload => {
                        res.send(JSON.stringify({
                            status: "ok",
                            payload
                        }));
                    })
                    .catch(err => {
                        console.error(err);
                        res
                            .set("Content-Type", "text/plain")
                            .status(500)
                            .send("Internal Server Error");
                    });
            })
            .catch(err => {
                console.error(err);
                res
                    .set("Content-Type", "text/plain")
                    .status(401)
                    .send("Unauthorized");
            });
    });
    app.post("/get/file", (req, res) => {
        const { payload } = req.body;
        decryptString(payload, key)
            .then(filename => {
                return getFileContents(filename)
                    .then(contents => {
                        return encryptString(contents, key);
                    })
                    .then(payload => {
                        res.send(JSON.stringify({
                            status: "ok",
                            payload
                        }));
                    })
                    .catch(err => {
                        console.error(err);
                        if (err.code === "ENOENT") {
                            res
                                .set("Content-Type", "text/plain")
                                .status(404)
                                .send("Not Found");
                            return;
                        }
                        res
                            .set("Content-Type", "text/plain")
                            .status(500)
                            .send("Internal Server Error");
                    });
            })
            .catch(err => {
                console.error(err);
                res
                    .set("Content-Type", "text/plain")
                    .status(401)
                    .send("Unauthorized");
            });
    });
    app.post("/put/file", (req, res) => {
        const { payload } = req.body;
        decryptString(payload, key)
            .then(JSON.parse)
            .then(({ contents, filename }) => {
                return putFileContents(filename, contents)
                    .then(() => {
                        res.send(JSON.stringify({
                            status: "ok"
                        }));
                    })
                    .catch(err => {
                        console.error(err);
                        res
                            .set("Content-Type", "text/plain")
                            .status(500)
                            .send("Internal Server Error");
                    });
            })
            .catch(err => {
                console.error(err);
                res
                    .set("Content-Type", "text/plain")
                    .status(401)
                    .send("Unauthorized");
            });
    });
    app.get("/get/homedir", (req, res) => {
        encryptString(getHomeDirectory(), key)
            .then(payload => {
                res.send(JSON.stringify({
                    status: "ok",
                    payload
                }));
            })
            .catch(err => {
                console.error(err);
                res
                    .set("Content-Type", "text/plain")
                    .status(500)
                    .send("Internal Server Error");
            });
    });
}

/**
 * Create a new host instance
 * @param {Number|undefined} port The port to listen on
 * @param {String} key The encryption key
 * @returns {Host} A new host instance
 */
function createHost(port, key) {
    const app = express();
    const emitter = new EventEmitter();
    const host = {
        app,
        emitter,
        server: null,
        stop: () => stopHost(host)
    };
    configureHost(host, key);
    if (port) {
        host.server = app.listen(port);
    }
    return host;
}

/**
 * Stop a host instance
 * @param {Host} host The host instance
 * @private
 */
function stopHost(host) {
    clearTimeout(host._timer);
    if (host.server) {
        host.server.close();
    }
    delete host.stop;
}

module.exports = {
    createHost
};
