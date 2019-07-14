const fs = require("fs");
const path = require("path");
const pify = require("pify");
const getHomeDirectory = require("home-dir");

const readDir = pify(fs.readdir);
const readFile = pify(fs.readFile);
const stat = pify(fs.stat);
const writeFile = pify(fs.writeFile);

const FILES_TO_HIDE = /^\./;
const IS_WINDOWS = process.platform === 'win32';

function getDirectoryContents(dir) {
    if (IS_WINDOWS && dir === '/') {
        return handleWindowsRootPath();
    }

    let dirRealPath = normalizePath(dir);
    return readDir(dirRealPath)
        .then(contents => Promise.all(contents.map(filename =>
            stat(path.join(dirRealPath, filename))
                .then(stat => ({
                    name: filename,
                    directory: dir,
                    isFile: stat.isFile(),
                    isDirectory: stat.isDirectory()
                }))
                .catch(err => {
                    console.error(`Error while trying to stat file: ${path.join(dirRealPath, filename)} (${err.message})`);
                    return null;
                })
        )))
        .then(contents =>
            contents
                .filter(item => item && (item.isDirectory || item.isFile) && FILES_TO_HIDE.test(item.name) === false)
                .map(dirEnt => ({
                    name: dirEnt.name,
                    directory: dirEnt.directory,
                    type: dirEnt.isDirectory ? "directory" : "file"
                }))
        );
}

function getFileContents(path) {
    return readFile(normalizePath(path), "utf8");
}

function putFileContents(path, contents) {
    // windows paths must have at least 3 parts due to drive letter
    // 2 or less parts mean script is write to a path that doesn't exist
    if (IS_WINDOWS && path.split('/').length <= 2) {
        return Promise.reject(new Error(`Can't write files on Windows root path`));
    }
    return writeFile(normalizePath(path), contents, "utf8");
}

function getWindowsDrives() {
    return new Promise((resolve, reject) => {
        let stdout = '';
        let stderr;
        const { spawn } = require('child_process'),
            list = spawn('cmd');

        list.stdout.on('data', (data) => stdout += data);
        list.stderr.on('data', (data) => stderr += data);

        list.on('exit', function (code) {
            if (code == 0) {
                let data = stdout.split('\r\n');
                data = data.splice(4, data.length - 7);
                data = data.map(drive => drive.substring(0, 1).toLowerCase());
                resolve(data);
            } else {
                reject({ code, message: stderr });
            }
        });
        list.stdin.write('wmic logicaldisk get caption\n');
        list.stdin.end();
    });

}

function handleWindowsRootPath(dir) {
    return getWindowsDrives()
        .then(drives => {
            return drives.map(drive => {
                return {
                    name: drive,
                    directory: '/',
                    type: 'directory'
                };
            });
        })
        .catch(err => {
            console.error(`Error while trying to get all Windows drives: (${err.message})`);
            return null;
        });
}

function normalizeWindowsPath(dir) {
    const drive = dir.substring(1, 2) + ':';
    const filePath = dir.substring(2) || '/';
    return path.join(drive, filePath);
}

function normalizePath(dir) {
    return (IS_WINDOWS) ? normalizeWindowsPath(dir) : dir;
}

module.exports = {
    getDirectoryContents,
    getFileContents,
    getHomeDirectory,
    putFileContents
};
