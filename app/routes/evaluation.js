/* Evaluations API routes */

var systemConfig = require('../../config/system');
var utilities = require('../utilities');
var fs = require('fs');

function addIfAbsent(array, value) {
    if (array.indexOf(value) == -1)
        array.push(value);
    return array;
}

function parseEntry(entry) {
    return entry.substr(1).replace(/\.json/g, '');
}

function initArrayPropIfNot(array, property) {
    if (!array.hasOwnProperty(property))
        array[property] = [];
}

function parseFileName(availableParams, filename) {
    var array = filename.split('-');
    array.forEach(function (e) {
        initArrayPropIfNot(availableParams, e[0]);
        addIfAbsent(availableParams[e[0]], parseEntry(e));
    });
}

module.exports = function (router) {

    router.get('/api/evaluations/', function (req, res) {
        fs.readdir(systemConfig.evaluationsLocation, function (err, files) {
            utilities.sendResult(res, err, files);
        });
    });

    router.get('/api/evaluations/:filename', function (req, res) {
        var json = JSON.parse(fs.readFileSync(systemConfig.evaluationsLocation + req.params.filename, 'utf8'));
        utilities.sendResult(res, null, json);
    });

    router.get('/api/infos/evaluations/', function (req, res) {
        fs.readdir(systemConfig.evaluationsLocation, function (err, files) {
            var availableParams = {};
            files.forEach(function (filename) {
                parseFileName(availableParams, filename);
            });
            utilities.sendResult(res, null, availableParams);
        });
    });

};