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
                .end(function(err, res) {
                    if (err) {
                        done.fail(err);
                        return;
                    };
                    expect(res.body).to.have.property("type", "secure-file-host");
                    expect(res.body).to.have.property("status", "ok");
                    expect(res.body).to.have.property("ready", true);
                    done();
                });
        });
    });
});
