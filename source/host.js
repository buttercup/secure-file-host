const EventEmitter = require("eventemitter3");
const express = require("express");
const pkgInfo = require("../package.json");
const { generateCipherKey, generateConnectCode } = require("./code.js");
const { encryptString } = require("./crypto.js");

const RESET_DELAY = 15000;
const SHOW_DURATION = 15000;

let __host = null;

function configureApp(app, emitter) {
    let connectCode = null;
        busy = false,
        timer;
    const timerReset = () => {
        clearTimeout(timer);
        connectCode = null;
        busy = true;
        emitter.emit("connectionAvailabilityChange", { available: false });
        timer = setTimeout(() => {
            busy = false;
            emitter.emit("connectionAvailabilityChange", { available: true });
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
            ready: !connectCode
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
        emitter.emit("presentCode", {
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
            const cipherKey = generateCipherKey();
            emitter.emit("connected", {
                key: cipherKey
            });
            encryptString(cipherKey, responseKey)
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
}

function createHost(port) {
    const app = express();
    const emitter = new EventEmitter();
    configureApp(app, emitter);
    __host = {
        app,
        emitter
    };
}

function getHost() {
    return __host;
}

module.exports = {
    createHost,
    getHost
};
