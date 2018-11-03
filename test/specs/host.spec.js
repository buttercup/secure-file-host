const request = require("supertest");
const { getNewApp } = require("../app.js");

describe("host", function() {
    let host;

    beforeEach(function() {
        host = getNewApp();
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
    });
});
