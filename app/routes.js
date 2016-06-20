var benchmarkSchema = require('./models/benchmark');
var nameSchema = require('./models/name');
var mongoose = require('mongoose');
var database = require('../config/database'); 			// load the database config
var child_process = require('child_process');

var clients = {};

/**
 * Default return fonction of the API for Mongoose queries
 * @param res result of the request
 * @param err errors of the mongoose query
 * @param objects the objects receive by the mongoose query
 */
function apiReturnResult(res, err, objects) {
    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
    if (err) {
        res.send('[ERROR] ' + err + '.\n');
    }
    res.json(objects);
}

/**
 * Parse benchmark parameters and return the corresponding command line
 * @param parameters object that contains all parameters
 * @returns {string} ycsb command line to execute
 */
function parseParameters(parameters) {
    // TODO : do a better parameters handling
    var parametersStr = '-P ' + parameters.workloadfilepath + ' ';
    for (var key in parameters.pParams) {
        parametersStr += '-p ' + key + '=' + parameters.pParams[key] + ' ';
    }
    parametersStr += "-p timeseries.granularity=" + parameters.timeseries.granularity + ' ';

    var cmd = "";

    if (typeof parameters.benchmarkname != "undefined" && parameters.benchmarkname !== "") {
        var benchmarkName = parameters.benchmarkname.replace(/[^\w\s]/gi, '');
        parametersStr += "-p benchmarkname=" + benchmarkName + ' ';

        cmd = 'cd ' + parameters.ycsbrootpath + ' && ./bin/ycsb ' + parameters.target + ' ' + parameters.db + ' ' + parametersStr;

        if (parameters.status) {
            cmd += '-s';
        }
    }

    return cmd;
}

/**
 * Execute a command on the server and send result only to the user that need the console feedback
 * @param cmd the command line to execute
 * @param benchmarkName the benchmark name (identify only users that need the console feedback)
 */
function executeCommand(cmd, benchmarkName) {
    var child = child_process.exec(cmd);
    var client = clients[benchmarkName]; // Only emitting on the right client

    client.emit('begin');
    child.stdout.on('data', function (data) {
        client.emit('stdout', {message: data});
    });

    child.stderr.on('data', function (data) {
        console.log('stderr emitted.');
        client.emit('stderr', {message: data});
    });

    child.on('exit', function (code) {
        //console.log('child process exited with code ' + code + '\n');
        client.emit('exit', {message: 'child process exited with code ' + code});
    });
}

module.exports = function (app, io) {

    // api ---------------------------------------------------------------------
    app.post('/cmd/launch', function (req, res) {
        var parameters = req.body;
        var cmd = parseParameters(parameters);
        if (cmd !== "") {
            executeCommand(cmd, parameters.benchmarkname);
            res.send('[SUCCESS] Benchmarking "' + parameters.target + '" in progress...\n');
        } else {
            res.send('[ERROR] Please enter a valid Benchmark Name.\n');
        }
    });

    // get one benchmark by name
    app.get('/api/benchmarks/:benchmark_name', function (req, res) {
        // use mongoose to get one benchmark in the database by name
        var Benchmark = mongoose.model('Benchmark', benchmarkSchema, req.parameters.benchmark_name);
        Benchmark
            .find(function (err, benchmarks) {
                apiReturnResult(res, err, benchmarks)
            });
    });

    app.get('/api/benchmarks/:benchmark_name/:operation_type', function (req, res) {
        // use mongoose to get one specific operation type 
        // results from a benchmark in the database identified by name
        var Benchmark = mongoose.model('Benchmark', benchmarkSchema, req.parameters.benchmark_name);
        Benchmark
            .where('operationType', req.parameters.operation_type)
            .sort('createdAt')
            .find(function (err, benchmarks) {
                apiReturnResult(res, err, benchmarks)
            });
    });

    app.get('/api/benchmarks/:benchmark_name/:operation_type/:from_date_timestamp', function (req, res) {
        // use mongoose to get one specific operation type results 
        // from a benchmark in the database identified by name
        // from a specific date
        var Benchmark = mongoose.model('Benchmark', benchmarkSchema, req.parameters.benchmark_name);
        Benchmark
            .where('operationType', req.parameters.operation_type)
            .where('createdAt').gt(parseInt(req.parameters.from_date_timestamp))
            .sort('createdAt')
            .find(function (err, benchmarks) {
                apiReturnResult(res, err, benchmarks)
            });
    });

    app.get('/api/benchmarks/names', function (req, res) {
        var Name = mongoose.model('Name', nameSchema);
        Name.find(function (err, names) {
            apiReturnResult(res, err, names)
        });
    });

    app.delete('/api/benchmarks/:benchmark_name', function (req, res) {
        var Name = mongoose.model('Name', nameSchema);
        Name.db.db.dropCollection(req.parameters.benchmark_name, function (err, result) {
            if (err) {
                res.send(err);
            }
            res.send(result);
        });
        Name.remove({
            name: req.parameters.benchmark_name
        }, function (err) {
            if (err) {
                res.send(err);
            }
        });
    });

    // application -------------------------------------------------------------
    app.get('*', function (req, res) {
        res.sendFile(__dirname + '/public/index.html'); // load the single view file 
        // (angular will handle the page changes on the front-end)
    });

    // socket ------------------------------------------------------------------
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


};