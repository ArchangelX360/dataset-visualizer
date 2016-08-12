/**
 * Created by archangel on 12/08/16.
 */

var systemConfig = require('../../config/system');
var fs = require('fs');
var readline = require('readline');
var utilities = require('../utilities');

var filename = process.argv[2];

/**
 * Raw measurement type line parser function
 * 
 * @param label the chart label
 * @param num the current num
 * @param line the line we want to parse
 * @param measures the collection of measures
 * @returns {*}
 */
function parseRaw(label, num, line, measures) {
    var array = line.split(',');
    if (array[0] === label) {
        var measure = {
            num: num,
            measure: parseInt(array[2]),
            label: label
        };
        measures.push(measure);
        num++;
    }
    return num;
}

function getImportFileContent(res, filename, label, sourceMeasurementType) {
    var num = 0;
    var measures = [];
    var parseFunc;

    switch (sourceMeasurementType) {
        // Add cases here to support other measurement type
        case "raw":
            parseFunc = parseRaw;
            break;
        default:
            utilities.sendResult(res, "Measurement type not supported.", null);
            return;
    }

    var rs = fs.createReadStream(systemConfig.importFileFolder + filename);
    rs.on('error', function (err) {
        utilities.sendResult(res, err, null);
    });

    readline.createInterface({
        input: rs,
        terminal: false
    }).on('line', function (line) {
        num = parseFunc(label, num, line, measures);
    }).on('close', function () {
        utilities.sendResult(res, null, measures);
    });
}

module.exports = function (router) {

    router.get('/api/import/:filename/:label/:sourceMeasurementType', function (req, res) {
        getImportFileContent(res, req.params.filename, req.params.label, req.params.sourceMeasurementType);
    });

    router.get('/api/import', function (req, res) {
        fs.readdir(systemConfig.importFileFolder, function (err, files) {
            utilities.sendResult(res, err, files);
        });
    });
};
