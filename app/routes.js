//var benchmarkSchema = require('./models/benchmark');
//var nameSchema = require('./models/name');
//var mongoose = require('mongoose');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var database = require('../config/database'); 			// load the database config
var child_process = require('child_process');
var systemConfig = require('../config/system'); 			// load the database config
var fs = require('fs');
var psTree = require('ps-tree');
var clients = {};


/* FOR TESTING ONLY */

var memcachedChild = null;

/**
 * Kill a process
 * @param pid the process to kill pid
 * @param signal the killing signal, default SIGKILL
 * @param callback the callback function
 */
var kill = function (pid, signal, callback) {
    signal = signal || 'SIGKILL';
    callback = callback || function () {
        };
    var killTree = true;
    if (killTree) {
        psTree(pid, function (err, children) {
            [pid].concat(
                children.map(function (p) {
                    return p.PID;
                })
            ).forEach(function (tpid) {
                try {
                    process.kill(tpid, signal)
                }
                catch (ex) {
                }
            });
            callback();
        });
    } else {
        try {
            process.kill(pid, signal)
        }
        catch (ex) {
        }
        callback();
    }
};

/**
 * Default return fonction of the API for Mongoose queries
 * @param res result of the request
 * @param err errors of the mongoose query
 * @param objects the objects receive by the mongoose query
 */
var apiReturnResult = function (res, err, objects) {
    var data = {"errors": null, "results": null};
    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
    if (err) {
        data.errors = '[ERROR] ' + err + '\n';
    } else {
        data.results = objects;
    }
    res.json(data);
};

/**
 * Parse benchmark parameters and return the corresponding parameters Array for child_process
 * @param parameters object that contains all parameters
 * @returns Array parameters for child_process spawn command
 */
var parseParameters = function (parameters) {
    var paramsArray = [];
    paramsArray.push('-P');
    paramsArray.push(systemConfig.workloadFolder + parameters.workloadfile);

    for (var key in parameters.pParams) {
        paramsArray.push('-p');
        paramsArray.push(key + '=' + parameters.pParams[key]);
    }
    paramsArray.push('-p');
    paramsArray.push("benchmarkname=" + parameters.benchmarkname.replace(/[^a-zA-Z0-9]/gi, ''));
    paramsArray.unshift(parameters.db);
    paramsArray.unshift(parameters.target);

    if (parameters.status) {
        paramsArray.push('-s');
    }

    return paramsArray;
};

/**
 * Execute a command on the server and send result only to the user that need the console feedback
 * @param program the program to execute
 * @param params parameters for child_process spawn command
 * @param benchmarkName the benchmark name (identify only users that need the console feedback)
 */
var executeCommand = function (program, params, benchmarkName) {
    var child = child_process.spawn(program, params);
    var client = clients[benchmarkName]; // Only emitting on the right client

    client.emit('begin');

    client.on('kill', function () {
        kill(child.pid);
        console.log("Client killed the benchmark.");
    });

    child.stdout.on('data', function (data) {
        client.emit('stdout', {message: data.toString()});
    });

    child.stderr.on('data', function (data) {
        client.emit('stderr', {message: data.toString()});
    });

    child.on('exit', function (code) {
        client.emit('exit', {message: 'child process exited with code ' + code + '\n'});
    });

};

var findDocuments = function (collectionName, selector, options, callback, res) {
    MongoClient.connect(database.localUrl, function (err, db) {
        assert.equal(null, err);
        db.collection(collectionName).find(selector, options).toArray(function (err, docs) {
            assert.equal(err, null);
            db.close();
            callback(res, err, docs);
        });
    });
};

var dropBenchmark = function (benchmarkName, callback, res) {
    MongoClient.connect(database.localUrl, function (err, db) {
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

module.exports = function (app, io) {
    /* Command API */

    app.post('/cmd/launch', function (req, res) {
        var parameters = req.body;
        var err = null;
        var response = null;
        if (typeof parameters.benchmarkname != "undefined" && parameters.benchmarkname !== "") {
            var program = systemConfig.ycsbExecutable;
            var paramsArray = parseParameters(parameters);
            executeCommand(program, paramsArray, parameters.benchmarkname);
            response = '[SUCCESS] Benchmarking "' + parameters.target + '" in progress...\n';
        } else {
            err = 'Please enter a valid Benchmark Name.';
        }
        apiReturnResult(res, err, response);
    });

    /* Benchmark API */

    // get a benchmark by name
    app.get('/api/benchmarks/:benchmark_name', function (req, res) {
        findDocuments(req.params.benchmark_name, {}, {}, apiReturnResult, res);
    });

    // get benchmark results by operation type
    app.get('/api/benchmarks/:benchmark_name/:operation_type', function (req, res) {
        // TODO : migration à verifier on SORT
        var selector = {operationType: req.params.operation_type};
        var options = {"sort": "createdAt"};
        findDocuments(req.params.benchmark_name, selector, options, apiReturnResult, res);
    });

    // get benchmark results by operation type from a specified date
    app.get('/api/benchmarks/:benchmark_name/:operation_type/:from_date_timestamp', function (req, res) {
        // TODO : migration à verifier
        var selector = {operationType: req.params.operation_type};
        var options = {
            "sort": "createdAt",
            "createdAt": {$gt: parseInt(req.params.from_date_timestamp)}
        };
        findDocuments(req.params.benchmark_name, selector, options, apiReturnResult, res);
    });


    // get benchmark results by operation type from a specified date
    app.get('/api/benchmarks/:benchmark_name/:operation_type/:from_date_timestamp/:to_date_timestamp',
        function (req, res) {
            // TODO : migration à verifier
            var selector = {operationType: req.params.operation_type};
            var options = {
                "sort": "createdAt",
                "createdAt": {
                    $lt: parseInt(req.params.to_date_timestamp),
                    $gt: parseInt(req.params.from_date_timestamp)
                }
            };
            findDocuments(req.params.benchmark_name, selector, options, apiReturnResult, res);
        });

    // get all benchmark names
    app.get('/api/benchmarks/names/', function (req, res) {
        console.log("test");
        // FIXME: not working anymore
        MongoClient.connect(database.localUrl, function (err, db) {
            db.listCollections().toArray(function (err, collections) {
                console.log(collections);
                db.close();
                apiReturnResult(res, err, collections);
            });
        });
    });

// delete a benchmark
    app.delete('/api/benchmarks/:benchmark_name', function (req, res) {
        dropBenchmark(req.params.benchmark_name, apiReturnResult, res);
    });

    /* Databases API */

// get all databases names
    app.get('/api/databases/', function (req, res) {
        var dbs = [];
        fs.readFile(systemConfig.ycsbExecutable, 'utf8', function (err, content) {
            var regexp = /(?:.*"(.*)".*"(com\.yahoo\.ycsb\.(?:db|BasicDB).*)",*[\r\n])/gi;
            var result = content.match(regexp);
            result.forEach(function (line) {
                var myRegexp = /.*"(.*)".*:.*"(?:.*)".*/g;
                var match = myRegexp.exec(line);
                dbs.push(match[1]);
            });
            apiReturnResult(res, err, dbs);
        });
    });

    /* Workloads API */

// get all workloads filenames
    app.get('/api/workloads/', function (req, res) {
        var files = fs.readdirSync(systemConfig.workloadFolder);
        apiReturnResult(res, null, files);
    });

// get workload content
    app.get('/api/workloads/:filename', function (req, res) {
        fs.readFile(systemConfig.workloadFolder + req.params.filename, 'utf8', function (err, content) {
            apiReturnResult(res, err, content)
        });
    });

// create a workload
    app.post('/api/workloads/', function (req, res) {
        var parameters = req.body;
        fs.writeFile(systemConfig.workloadFolder + parameters.filename.replace(/[^a-zA-Z0-9\-\_]/gi, ''),
            parameters.content, function (err) {
                apiReturnResult(res, err, "File saved.")
            });
    });

// delete a workload
    app.delete('/api/workloads/:filename', function (req, res) {
        fs.unlink(systemConfig.workloadFolder + req.params.filename, function (err) {
            apiReturnResult(res, err, "File deleted.")
        });
    });


    /* FOR TESTING ONLY */

    app.get('/cmd/memcached', function (req, res) {
        var parameters = [];
        parameters.push("-m");
        parameters.push(systemConfig.memcachedMaxMemory);
        parameters.push("-p");
        parameters.push(systemConfig.memcachedPort);
        parameters.push("-u");
        parameters.push(systemConfig.memcachedUser);
        parameters.push("-l");
        parameters.push(systemConfig.memcachedAddress);
        memcachedChild = child_process.spawn(systemConfig.memcachedExecutable, parameters);
        apiReturnResult(res, null, '[SUCCESS] Memcached is running on '
            + systemConfig.memcachedAddress + ':' + systemConfig.memcachedPort
            + ' by ' + systemConfig.memcachedUser + '.\n');
    });

    app.delete('/cmd/memcached', function (req, res) {
        var response = "";
        var err = null;
        if (memcachedChild) {
            kill(memcachedChild.pid);
            response = '[SUCCESS] Your memcached instance is killed.\n';
        } else {
            err = 'No instance to kill.';
        }

        apiReturnResult(res, err, response);
    });


    /* Application */

    app.get('*', function (req, res) {
        res.sendFile(__dirname + '/public/index.html'); // load the single view file
        // (angular will handle the page changes on the front-end)
    });

    /* Sockets */

    io.sockets.on('connection', function (socket) {
        console.log('Client connected with id : ' + socket.id);

        socket.on('authentication', function (benchmarkName) {
            console.log("Authenticate with : " + benchmarkName);
            clients[benchmarkName] = socket;
        });

        socket.on('disconnect', function (socket) {
            console.log('Client disconnected with id : ' + socket.id);
        });
    });

}
;