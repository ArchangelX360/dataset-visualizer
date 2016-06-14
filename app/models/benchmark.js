var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var benchmarkSchema = new Schema({
    operationType: {type: String, required: true},
    time: Number,
    latency: Number,
    createdAt: Number
});
module.exports = benchmarkSchema;