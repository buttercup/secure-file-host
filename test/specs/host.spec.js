const request = require("supertest");
const { getNewApp } = require("../app.js");

describe("host", function() {
    beforeEach(function() {
        const host = getNewApp();
        this.emitter = host.emitter;
        this.app = host.app;
    });

    describe("GET /", function() {
        it("returns expected properties", done => {
            request(this.app)
                .get("/")
                .expect("Content-Type", /application\/json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) throw err;
                    expect(res.body).to.have.property("type", "secure-file-host");
                });
        });
    });
});
