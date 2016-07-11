/* Benchmarks API routes */
var assert = require('assert');
var utilities = require('../utilities');
var systemConfig = require('../../config/system');
var debug = require('debug')('benchmark');

var findDocuments = function (db, collectionName, selector, options, callback, res) {
    db.collection(collectionName).find(selector, options).toArray(function (err, docs) {
        callback(res, err, docs);
    });
};

var dropBenchmark = function (db, benchmarkName, callback, res) {
    db.dropCollection(benchmarkName, function (err, result) {
        if (err) {
            res.status(500).json(err);
            return;
        }
        db.collection(systemConfig.countersCollectionName).deleteMany({collection: benchmarkName}, {}, function (err) {
            callback(res, err, result);
        });
    });
};

module.exports = function (router, db) {

    /* Benchmark API */

    // get a benchmark by name
    router.get('/api/benchmarks/:benchmark_name', function (req, res) {
        findDocuments(db, req.params.benchmark_name, {}, {}, utilities.sendResult, res);
    });

    // delete a benchmark
    router.delete('/api/benchmarks/:benchmark_name', function (req, res, next) {
        dropBenchmark(db, req.params.benchmark_name, utilities.sendResult, res, next);
    });

    // get benchmark results by label
    router.get('/api/benchmarks/:benchmark_name/:label', function (req, res) {
        var selector = {label: req.params.label};
        var options = {"sort": "num"};
        findDocuments(db, req.params.benchmark_name, selector, options, utilities.sendResult, res);
    });

    // get benchmark results by label from a specified date
    router.get('/api/benchmarks/:benchmark_name/:label/:from', function (req, res) {
        var selector = {
            label: req.params.label,
            num: {$gt: parseInt(req.params.from)}
        };
        var options = {"sort": "num"};
        findDocuments(db, req.params.benchmark_name, selector, options, utilities.sendResult, res);
    });

    // get all benchmark names
    router.get('/nav/names', function (req, res) {
        db.listCollections().toArray(function (err, collections) {
            if (!err) {
                var filteredCollections = collections.reduce(function (res, nameObject) {
                    if (nameObject.name != "system.indexes" && nameObject.name != systemConfig.countersCollectionName) {
                        res.push(nameObject.name);
                    }
                    return res;
                }, []);
            }
            utilities.sendResult(res, err, filteredCollections);
        });
    });


    router.get('/api/infos/benchmarks/size/:benchmark_name/:label', function (req, res) {
        db.collection(req.params.benchmark_name).count({label: req.params.label},
            function (err, count) {
                utilities.sendResult(res, err, parseInt(count));
            });
    });

    router.get('/api/aggregate/:benchmark_name/:label/:from/:to/:limit/:bucket_size', function (req, res) {
        /* Warning: result could exceed limit by a few points */

        var limit = req.params.limit;
        var benchmarkName = req.params.benchmark_name;
        var bucketSize = parseInt(req.params.bucket_size);
        var match = {
            $match: {
                label: req.params.label,
                num: {
                    $lt: (req.params.to === "MAX") ? Number.MAX_VALUE : parseInt(req.params.to),
                    $gt: parseInt(req.params.from)
                }
            }
        };
        var project = {
            "$project": {
                "measure": 1,
                "label": 1,
                "num": 1
            }
        };

        var group = {
            "$group": {
                "_id": {
                    "o": "$label",
                    'interval': {
                        '$subtract': [{'$divide': ['$num', bucketSize]},
                            {'$mod': [{'$divide': ['$num', bucketSize]}, 1]}]
                    }
                },
                "label": {$first: "$label"},
                "num": {$first: "$num"},
                "measure": {
                    "$avg": "$measure"
                }
            }
        };

        var sort = {"$sort": {"num": 1}};

        debug('[' + req.params.label + '] Aggregating with bucket size: ' + bucketSize);
        db.collection(benchmarkName).aggregate([match, project, group, sort], {allowDiskUse: true})
            .toArray(function (err, results) {
                debug('[' + req.params.label + '] Result length: ' + results.length);
                if (results.length > limit)
                    debug('[WARNING][' + req.params.label + '] result a bit longer than limit');
                utilities.sendResult(res, err, results);
            });
    });

};
