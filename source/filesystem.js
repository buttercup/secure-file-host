const fs = require("fs");
const pify = require("pify");
const getHomeDirectory = require("home-dir");

const readDir = pify(fs.readdir);
const readFile = pify(fs.readFile);

function getDirectoryContents(dir) {
    return readDir(dir, { withFileTypes: true })
        .then(contents => {
            return contents
                .filter(item => item.isDirectory() || item.isFile())
                .map(dirEnt => ({
                    name: dirEnt.name,
                    type: item.isDirectory() ? "directory" : "file"
                }));
        });
}

function getFileContents(path) {
    return readFile(path, "utf8");
}

module.exports = {
    getDirectoryContents,
    getFileContents,
    getHomeDirectory
};
