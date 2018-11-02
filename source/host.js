const EventEmitter = require("eventemitter3");
const express = require("express");
const pkgInfo = require("../package.json");
const { generateConnectCode } = require("./code.js");
const { decryptString, encryptString } = require("./crypto.js");
const { getDirectoryContents, getFileContents, getHomeDirectory } = require("./filesystem.js");

const RESET_DELAY = 15000;
const SHOW_DURATION = 15000;

let __host = null;

function configureApp(app, emitter, key) {
    let connectCode = null,
        busy = false,
        timer;
    const timerReset = () => {
        clearTimeout(timer);
        connectCode = null;
        busy = true;
        emitter.emit("connectionAvailabilityChanged", { available: false });
        timer = setTimeout(() => {
            busy = false;
            emitter.emit("connectionAvailabilityChanged", { available: true });
        }, RESET_DELAY);
    };
    app.disable("x-powered-by");
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

function createHost(port, key) {
    const app = express();
    const emitter = new EventEmitter();
    configureApp(app, emitter, key);
    if (port) {
        app.listen(port);
    }
    __host = {
        app,
        emitter
    };
    return __host;
}

function getHost() {
    return __host;
}

module.exports = {
    createHost,
    getHost
};