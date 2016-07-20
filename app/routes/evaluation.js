/* Evaluations API routes */

var systemConfig = require('../../config/system');
var utilities = require('../utilities');
var fs = require('fs');

module.exports = function (router) {
    router.get('/api/evaluations/', function (req, res) {
        fs.readdir(systemConfig.evaluationsLocation, function (err, files) {
            utilities.sendResult(res, err, files);
        });
    });

    // get all databases names
    router.get('/api/evaluations/:filename', function (req, res) {
        var json = JSON.parse(fs.readFileSync(systemConfig.evaluationsLocation + req.params.filename, 'utf8'));
        utilities.sendResult(res, null, json);
    });
};