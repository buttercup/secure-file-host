const path = require("path");
const request = require("supertest");
const { getNewApp } = require("../app.js");
const { decryptString, encryptString } = require("../../source/crypto.js");

describe("API", function() {
    let host;

    beforeEach(function() {
        host = getNewApp();
    });

    afterEach(function() {
        host.stop();
    });

    describe("GET /", function() {
        it("returns expected properties", done => {
            request(host.app)
                .get("/")
                .expect("Content-Type", /application\/json/)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property("type", "secure-file-host");
                    expect(res.body).to.have.property("status", "ok");
                    expect(res.body).to.have.property("ready", true);
                    done();
                });
        });
    });

    describe("GET /connect", function() {
        it("responds with OK status", done => {
            request(host.app)
                .get("/connect")
                .expect("Content-Type", /application\/json/)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property("status", "ok");
                    done();
                });
        });

        it("responds with 503 Unavailable if called twice", done => {
            request(host.app)
                .get("/connect")
                .expect("Content-Type", /application\/json/)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    request(host.app)
                        .get("/connect")
                        .expect("Content-Type", /text\/plain/)
                        .expect(503)
                        .end((err, res) => {
                            if (err) return done(err);
                            done();
                        });
                });
        });

        it("emits 'codeReady' with connection code", done => {
            host.emitter.once("codeReady", data => {
                expect(data).to.have.property("code")
                    .that.is.a("string")
                    .that.matches(/^[A-Z0-9]{6}$/);
                done();
            });
            request(host.app)
                .get("/connect")
                .end((err, res) => {
                    if (err) return done(err);
                });
        });
    });

    describe("GET /connect/(code)", function() {
        it("responds with 400 Bad Request if no code sequence has been started", done => {
            request(host.app)
                .get("/connect/ABC123")
                .expect("Content-Type", /text\/plain/)
                .expect(400)
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });

        it("responds with an encrypted code when prepared", done => {
            let code;
            host.emitter.once("codeReady", result => {
                code = result.code;
            });
            request(host.app)
                .get("/connect")
                .expect("Content-Type", /application\/json/)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    request(host.app)
                        .get(`/connect/${code}`)
                        .expect("Content-Type", /application\/json/)
                        .expect(200)
                        .end((err, res) => {
                            if (err) return done(err);
                            expect(res.body).to.have.property("status", "ok");
                            decryptString(res.body.payload, code)
                                .then(result => {
                                    expect(result).to.equal("testing");
                                    done();
                                })
                                .catch(done);
                        });
                });
        });
    });

    describe("POST /get/directory", function() {
        const TARGET_DIR = path.resolve(__dirname, "../assets");
        let encryptedPayload;

        beforeEach(function() {
            return encryptString(TARGET_DIR, "testing")
                .then(encrypted => {
                    encryptedPayload = encrypted;
                });
        });

        it("returns expected contents", done => {
            request(host.app)
                .post("/get/directory")
                .send({
                    payload: encryptedPayload
                })
                .expect("Content-Type", /application\/json/)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property("status", "ok");
                    decryptString(res.body.payload, "testing")
                        .then(filesRaw => {
                            const files = JSON.parse(filesRaw);
                            expect(files).to.have.lengthOf(1);
                            expect(files[0]).to.have.property("name", "getfile.txt");
                            expect(files[0]).to.have.property("type", "file");
                            done();
                        })
                        .catch(done);
                });
        });

        it("responds with 401 Unauthorized if decryption of the payload fails", done => {
            request(host.app)
                .post("/get/directory")
                .send({
                    payload: "bad-payload"
                })
                .expect("Content-Type", /text\/plain/)
                .expect(401)
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });
    });

    describe("POST /get/file", function() {
        const TARGET_FILE = path.resolve(__dirname, "../assets/getfile.txt");
        let encryptedPayload;

        beforeEach(function() {
            return encryptString(TARGET_FILE, "testing")
                .then(encrypted => {
                    encryptedPayload = encrypted;
                });
        });

        it("returns expected contents", done => {
            request(host.app)
                .post("/get/file")
                .send({
                    payload: encryptedPayload
                })
                .expect("Content-Type", /application\/json/)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property("status", "ok");
                    decryptString(res.body.payload, "testing")
                        .then(fileContents => {
                            expect(fileContents.trim()).to.equal("test contents");
                            done();
                        })
                        .catch(done);
                });
        });

        it("responds with 401 Unauthorized if decryption of the payload fails", done => {
            request(host.app)
                .post("/get/file")
                .send({
                    payload: "bad-payload"
                })
                .expect("Content-Type", /text\/plain/)
                .expect(401)
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });

        it("responds with 404 Not Found when reading a non-existant file", done => {
            encryptString("/not/here.txt", "testing")
                .then(encrypted => {
                    encryptedPayload = encrypted;
                    request(host.app)
                        .post("/get/file")
                        .send({
                            payload: encryptedPayload
                        })
                        .expect("Content-Type", /text\/plain/)
                        .expect(404)
                        .end((err, res) => {
                            if (err) return done(err);
                            done();
                        });
                })
                .catch(done);
        });
    });
});
