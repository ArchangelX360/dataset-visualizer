var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var benchmarkSchema = new Schema({
    operationType: {type: String,required: true},
    values: [{time: Number, latency: Number, createdAt: {type: Date, default: Date.now}}]
});
module.exports = mongoose.model('Benchmark', benchmarkSchema, 'test1');