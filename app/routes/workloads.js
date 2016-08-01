/* Workloads API routes */

var fs = require('fs');
var systemConfig = require('../../config/system');
var utilities = require('../utilities');
var mkdirp = require('mkdirp');

function verifyFilename(res, filename, callback, params) {
    if (typeof filename !== "undefined" && filename !== "") {
        callback(res, filename.replace(/[^a-zA-Z0-9\-\_]/gi, ''), params);
    } else {
        utilities.sendResult(res, "Incorrect filename.", null)
    }
}

function deleteWorkload(res, filename) {
    fs.unlink(systemConfig.workloadFolder + filename, function (err) {
        utilities.sendResult(res, err, "File deleted.")
    });
}

function getWorkloadContent(res, filename) {
    fs.readFile(systemConfig.workloadFolder + filename, 'utf8', function (err, content) {
        utilities.sendResult(res, err, content)
    });
}

function createWorkload(res, filename, content) {
    mkdirp(systemConfig.workloadFolder, function (err) {
        if (err) {
            res.status(errorCode || 500).json(err);
            return;
        }
        fs.writeFile(systemConfig.workloadFolder + filename, content, 'utf8', function (err) {
            utilities.sendResult(res, err, "File saved.")
        });
    });
}

function getWorkloadNames(res) {
    fs.readdir(systemConfig.workloadFolder, function (err, files) {
        utilities.sendResult(res, err, files);
    });
}

module.exports = function (router) {
    // get all workloads filenames
    router.get('/api/workloads/', function (req, res) {
        getWorkloadNames(res);
    });

    // create a workload
    router.post('/api/workloads/', function (req, res) {
        verifyFilename(res, req.body.filename, createWorkload, req.body.content);
    });

    // get workload content
    router.get('/api/workloads/:filename', function (req, res) {
        verifyFilename(res, req.params.filename, getWorkloadContent);
    });

    // delete a workload
    router.delete('/api/workloads/:filename', function (req, res) {
        verifyFilename(res, req.params.filename, deleteWorkload);
    });
};