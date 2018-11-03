const fs = require("fs");
const path = require("path");
const pify = require("pify");
const getHomeDirectory = require("home-dir");

const readDir = pify(fs.readdir);
const readFile = pify(fs.readFile);
const stat = pify(fs.stat);

function getDirectoryContents(dir) {
    return readDir(dir)
        .then(contents => Promise.all(contents.map(filename =>
            stat(path.join(dir, filename))
                .then(stat => ({
                    name: filename,
                    isFile: stat.isFile(),
                    isDirectory: stat.isDirectory()
                }))
        )))
        .then(contents =>
            contents
                .filter(item => item.isDirectory || item.isFile)
                .map(dirEnt => ({
                    name: dirEnt.name,
                    type: dirEnt.isDirectory ? "directory" : "file"
                }))
        );
}

function getFileContents(path) {
    return readFile(path, "utf8");
}

module.exports = {
    getDirectoryContents,
    getFileContents,
    getHomeDirectory
};
