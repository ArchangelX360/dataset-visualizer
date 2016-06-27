var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var benchmarkSchema = new Schema({
    operationType: {type: String, required: true},
    latency: Number,
    createdAt: Number
});
module.exports = benchmarkSchema;