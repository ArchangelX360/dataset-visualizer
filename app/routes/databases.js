/* Databases API routes */

var systemConfig = require('../../config/system');
var utilities = require('../utilities');
var readline = require('readline');
var fs = require('fs');

module.exports = function (router) {
    // get all databases names
    router.get('/api/databases/', function (req, res) {
        var filename;
        var regexStr;
        var dbArray = [];

        if (systemConfig.useBindingFile) {
            filename = systemConfig.ycsbBindingsFile;
            regexStr = /^(.*):.*/;
        } else {
            filename = systemConfig.ycsbPythonExecutable;
            regexStr = /"(.*)".*:.*"com\.yahoo\.ycsb\.(?:db|BasicDB).*"/;
        }

        var readStream = fs.createReadStream(filename);
        readStream.on('error', function (err) {
            utilities.sendResult(res, err, null);
        });

        var lineReader = readline.createInterface({input: readStream});
        lineReader.on('line', function (line) {
            if (line[0] !== "#") {
                var dbStr = regexStr.exec(line);
                if (dbStr)
                    dbArray.push(dbStr[1]);
            }
        });
        lineReader.on('close', function () {
            utilities.sendResult(res, null, dbArray);
        });
    });
};