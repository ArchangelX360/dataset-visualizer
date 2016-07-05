/* Workloads API routes */
var fs = require('fs');
var systemConfig = require('../../config/system');
var utilities = require('../utilities');

module.exports = function (router) {
    // get all workloads filenames
    router.get('/api/workloads/', function (req, res) {
        var files = fs.readdirSync(systemConfig.workloadFolder);
        utilities.sendResult(res, null, files);
    });

    // create a workload
    router.post('/api/workloads/', function (req, res) {
        var parameters = req.body;
        fs.writeFile(systemConfig.workloadFolder + parameters.filename.replace(/[^a-zA-Z0-9\-\_]/gi, ''),
            parameters.content, function (err) {
                utilities.sendResult(res, err, "File saved.")
            });
    });

    // get workload content
    router.get('/api/workloads/:filename', function (req, res) {
        fs.readFile(systemConfig.workloadFolder + req.params.filename, 'utf8', function (err, content) {
            utilities.sendResult(res, err, content)
        });
    });

    // delete a workload
    router.delete('/api/workloads/:filename', function (req, res) {
        fs.unlink(systemConfig.workloadFolder + req.params.filename, function (err) {
            utilities.sendResult(res, err, "File deleted.")
        });
    });
};