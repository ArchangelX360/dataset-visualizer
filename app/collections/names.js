var mongoose = require('mongoose');
var database = require('../../config/database'); 			// load the database config
var conn = mongoose.createConnection(database.localUrl);
conn.on('open', function () {
    conn.db.listCollections().toArray(function (err, names) {
        console.log(err, names);
        conn.close();
        module.exports.Collection = names.map(function (element) {
            return element.name
        });
    });
});