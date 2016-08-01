var json2csv = require('json2csv');
var fs = require('fs');
var systemConfig = require('../config/system');
var mkdirp = require('mkdirp');

module.exports = {

    /**
     * Send a formatted result object
     * @param res result of the request
     * @param err errors of the mongodb query
     * @param objects the mongodb results
     * @param errorCode request error code if different than an internal error
     */
    sendResult: function (res, err, objects, errorCode) {
        if (err) {
            res.status(errorCode || 500).json(err);
            return;
        }
        res.json(objects);
    },

    dumpResult: function (res, err, objects, errorCode) {
        if (err) {
            res.status(errorCode || 500).json(err);
            return;
        }

        var fields = ['num', 'label', 'measure'];
        var csv = json2csv({data: objects, fields: fields});
        var filename = Date.now();

        mkdirp(systemConfig.dbDumpsFolder, function (err) {
            if (err) {
                res.status(errorCode || 500).json(err);
                return;
            }
            fs.writeFile(systemConfig.dbDumpsFolder + filename + '.csv', csv, 'utf8', function (err) {
                if (err) {
                    res.status(errorCode || 500).json(err);
                    return;
                }
                res.json({
                    message: "Benchmark dumped into CSV file: " + systemConfig.dbDumpsFolder + filename + '.csv' + "."
                });
            });
        });
    }
};