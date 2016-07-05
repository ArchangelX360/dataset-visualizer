/* Databases API routes */

var systemConfig = require('../../config/system');
var fs = require('fs');
var utilities = require('../utilities');

module.exports = function (router) {
// get all databases names
    router.get('/api/databases/', function (req, res) {
        var dbs = [];
        fs.readFile(systemConfig.ycsbExecutable, 'utf8', function (err, content) {
            var regexp = /(?:.*"(.*)".*"(com\.yahoo\.ycsb\.(?:db|BasicDB).*)",*[\r\n])/gi;
            var result = content.match(regexp);
            result.forEach(function (line) {
                var myRegexp = /.*"(.*)".*:.*"(?:.*)".*/g;
                var match = myRegexp.exec(line);
                dbs.push(match[1]);
            });
            utilities.sendResult(res, err, dbs);
        });
    });
}