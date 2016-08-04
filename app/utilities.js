var json2csv = require('json2csv');
var fs = require('fs');

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

    sendCSV: function (res, err, objects, errorCode) {
        if (err) {
            res.status(errorCode || 500).json(err);
            return;
        }

        json2csv({data: objects, flatten: true}, function (err, csv) {
            if (err) {
                res.status(errorCode || 500).json(err);
                return;
            }

            res.json({csv: csv, message: "Database dump converted into CSV."});
        });
    }
};