var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var database = require('../../config/database');
var utilities = require('../utilities');

var findDocuments = function (collectionName, selector, options, callback, res) {
    MongoClient.connect(database.url, function (err, db) {
        assert.equal(null, err);
        db.collection(collectionName).find(selector, options).toArray(function (err, docs) {
            assert.equal(err, null);
            db.close();
            callback(res, err, docs);
        });
    });
};

var dropBenchmark = function (benchmarkName, callback, res) {
    MongoClient.connect(database.url, function (err, db) {
        assert.equal(null, err);
        db.dropCollection(benchmarkName, function (err, result) {
            assert.equal(err, null);
            db.collection("names").remove({name: benchmarkName}, {}, function (err) {
                assert.equal(null, err);
                callback(res, err, result);
                db.close();
            });
        });
    });
};

module.exports = function (router) {

    /* Benchmark API */

    // get a benchmark by name
    router.get('/api/benchmarks/:benchmark_name', function (req, res) {
        findDocuments(req.params.benchmark_name, {}, {}, utilities.sendResult, res);
    });

    // delete a benchmark
    router.delete('/api/benchmarks/:benchmark_name', function (req, res) {
        dropBenchmark(req.params.benchmark_name, utilities.sendResult, res);
    });

    // get benchmark results by operation type
    router.get('/api/benchmarks/:benchmark_name/:operation_type', function (req, res) {
        var selector = {operationType: req.params.operation_type};
        var options = {"sort": "num"};
        findDocuments(req.params.benchmark_name, selector, options, utilities.sendResult, res);
    });

    // get benchmark results by operation type from a specified date
    router.get('/api/benchmarks/:benchmark_name/:operation_type/:from', function (req, res) {
        var selector = {
            operationType: req.params.operation_type,
            num: {$gt: parseInt(req.params.from)}
        };
        var options = {"sort": "num"};
        findDocuments(req.params.benchmark_name, selector, options, utilities.sendResult, res);
    });

    // get benchmark results by operation type from a specified date
    router.get('/api/benchmarks/:benchmark_name/:operation_type/:from/:to',
        function (req, res) {

            // FIXME : should return a quality serie

            var selector = {
                operationType: req.params.operation_type,
                num: {
                    $lt: parseInt(req.params.to),
                    $gt: parseInt(req.params.from)
                }
            };
            var options = {
                "sort": "num"
            };
            findDocuments(req.params.benchmark_name, selector, options, utilities.sendResult, res);
        });

    // get all benchmark names
    router.get('/nav/names', function (req, res) {
        MongoClient.connect(database.url, function (err, db) {
            db.listCollections().toArray(function (err, collections) {
                db.close();
                collections.shift(); // removing system collection
                utilities.sendResult(res, err, collections);
            });
        });
    });


    router.get('/api/infos/benchmarks/size/:benchmark_name/:operation_type', function (req, res) {
        MongoClient.connect(database.url, function (err, db) {
            db.collection(req.params.benchmark_name).count({operationType: req.params.operation_type},
                function (err, count) {
                    assert.equal(err, null);
                    db.close();
                    utilities.sendResult(res, err, parseInt(count));
                });
        });
    });

    router.get('/api/aggregate/:benchmark_name/:operation_type/:from/:to/:limit/:bucket_size', function (req, res) {
        // Warning: result could exceed limit by a few points

        var limit = req.params.limit;
        var benchmarkName = req.params.benchmark_name;
        var bucketSize = parseInt(req.params.bucket_size);
        var match = {
            $match: {
                operationType: req.params.operation_type,
                num: {
                    $lt: (req.params.to === "MAX") ? Number.MAX_VALUE : parseInt(req.params.to),
                    $gt: parseInt(req.params.from)
                }
            }
        };
        var project = {
            "$project": {
                "latency": 1,
                "operationType": 1,
                "num": 1
            }
        };

        var group = {
            "$group": {
                "_id": {
                    "o": "$operationType",
                    'interval': {
                        '$subtract': [{'$divide': ['$num', bucketSize]},
                            {'$mod': [{'$divide': ['$num', bucketSize]}, 1]}]
                    }
                },
                "operationType": {$first: "$operationType"},
                "num": {$first: "$num"},
                "latency": {
                    "$avg": "$latency"
                }
            }
        };

        var sort = {"$sort": {"num": 1}};

        console.log('[' + req.params.operation_type + '] Aggregating...');

        MongoClient.connect(database.url, function (err, db) {
            console.log('[' + req.params.operation_type + '] Bucket size: ' + bucketSize);
            db.collection(benchmarkName).aggregate(
                [match, project, group, sort],
                {allowDiskUse: true}
            ).toArray(function (err, results) {
                if (err) {
                    console.log(err)
                }
                console.log('[' + req.params.operation_type + '] Result length: ' + results.length);
                db.close();
                utilities.sendResult(res, err, results);
                if (results.length > limit) {
                    console.log('[WARNING][' + req.params.operation_type + '] result a bit longer than limit');
                }
            });
        });
    });

};
