const fs = require("fs");
const path = require("path");
const pify = require("pify");
const getHomeDirectory = require("home-dir");

const readDir = pify(fs.readdir);
const readFile = pify(fs.readFile);
const stat = pify(fs.stat);
const writeFile = pify(fs.writeFile);

const FILES_TO_HIDE = /^\./;

function getDirectoryContents(dir) {
    return readDir(dir)
        .then(contents => Promise.all(contents.map(filename =>
            stat(path.join(dir, filename))
                .then(stat => ({
                    name: filename,
                    directory: dir,
                    isFile: stat.isFile(),
                    isDirectory: stat.isDirectory()
                }))
        )))
        .then(contents =>
            contents
                .filter(item => (item.isDirectory || item.isFile) && FILES_TO_HIDE.test(item.name) === false)
                .map(dirEnt => ({
                    name: dirEnt.name,
                    directory: dirEnt.directory,
                    type: dirEnt.isDirectory ? "directory" : "file"
                }))
        );
}

function getFileContents(path) {
    return readFile(path, "utf8");
}

function putFileContents(path, contents) {
    return writeFile(path, contents, "utf8");
}

module.exports = {
    getDirectoryContents,
    getFileContents,
    getHomeDirectory,
    putFileContents
};
