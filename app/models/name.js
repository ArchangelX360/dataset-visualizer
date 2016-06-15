var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var nameSchema = new Schema({
    name: {type: String, required: true},
});
module.exports = nameSchema;