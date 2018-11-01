const EventEmitter = require("eventemitter3");
const express = require("express");
const pkgInfo = require("../package.json");
const { generateConnectCode } = require("./code.js");

let __host = null;

function configureApp(app, emitter) {
    let connectCode = null;
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
        if (connectCode) {
            res
                .set("Content-Type", "text/plain")
                .status(503)
                .send("Unavailable");
            return;
        }
        connectCode = generateConnectCode();
        res.send(JSON.stringify({
            status: "ok"
        }));
    });
    app.get("/connect/:code", (req, res) => {
        const { code } = req.params;
        if (!connectCode) {
            res
                .set("Content-Type", "text/plain")
                .status(400)
                .send("Bad Request");
            return;
        } else if (code !== connectCode) {
            res
                .set("Content-Type", "text/plain")
                .status(401)
                .send("Unauthorized");
            return;
        }

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
