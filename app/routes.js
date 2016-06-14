var benchmarkSchema = require('./models/benchmark');
var mongoose = require('mongoose');
var database = require('../config/database'); 			// load the database config
var child_process = require('child_process');

var clients = {};

function apiReturnResult(res, err, benchmarks) {
    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
    if (err) {
        res.send(err);
    }
    res.json(benchmarks);
}

// TODO : verify this sorting thing

function getBenchmarkByName(res, benchmarkName) {
    var Benchmark = mongoose.model('Benchmark', benchmarkSchema, benchmarkName);
    Benchmark
        .find(function (err, benchmarks) {
        apiReturnResult(res, err, benchmarks)
    });
}

function getBenchmarkByNameByOperationType(res, benchmarkName, operationType) {
    var Benchmark = mongoose.model('Benchmark', benchmarkSchema, benchmarkName);
    Benchmark
        .where('operationType', operationType)
        .sort('createdAt')
        .find(function (err, benchmarks) {
        apiReturnResult(res, err, benchmarks)
    });
}

function getBenchmarkByNameByOperationTypeByFromDate(res, benchmarkName, operationType, dateFromTimestamp) {
    var Benchmark = mongoose.model('Benchmark', benchmarkSchema, benchmarkName);
    Benchmark
        .where('operationType', operationType)
        .where('createdAt').gt(dateFromTimestamp)
        .sort('createdAt')
        .find(function (err, benchmarks) {
        apiReturnResult(res, err, benchmarks)
    });
}

function launchBenchmark(req, res) {
    var params = req.body;

    // TODO : do a better params handling
    var paramsStr = '-P ' + params.workloadfilepath + ' ';
    for (var key in params.pParams) {
        paramsStr += '-p ' + key + '=' + params.pParams[key] + ' ';
    }
    paramsStr += "-p timeseries.granularity=" + params.timeseries.granularity + ' ';

    if (typeof params.benchmarkname != "undefined" && params.benchmarkname !== "") {
        var benchmarkName = params.benchmarkname.replace(/[^\w\s]/gi, '');
        paramsStr += "-p benchmarkname=" + benchmarkName + ' ';

        var cmd = 'cd ' + params.ycsbrootpath + ' && ./bin/ycsb ' + params.target + ' ' + params.db + ' ' + paramsStr;

        if (params.status) {
            cmd += '-s';
        }

        executeCommandStr(cmd, params.benchmarkname);
        res.send('[SUCCESS] Benchmarking "' + params.target + '" in progress...\n');
    } else {
        res.send('[ERROR] Please enter a valid Benchmark Name.\n');
    }
}

function executeCommandStr(cmd, benchmarkName) {
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
    // get one benchmark by name
    app.get('/api/benchmarks/:benchmark_name', function (req, res) {
        // use mongoose to get one benchmark in the database by name
        getBenchmarkByName(res, req.params.benchmark_name);
    });

    app.get('/api/benchmarks/:benchmark_name/:operation_type', function (req, res) {
        // use mongoose to get one specific operation type results from a benchmark in the database identified by name
        getBenchmarkByNameByOperationType(res, req.params.benchmark_name, req.params.operation_type);
    });

    app.get('/api/benchmarks/:benchmark_name/:operation_type/:from_date_timestamp', function (req, res) {
        // use mongoose to get one specific operation type results 
        // from a benchmark in the database identified by name
        // from a specific date
        getBenchmarkByNameByOperationTypeByFromDate(res, req.params.benchmark_name,
            req.params.operation_type, parseInt(req.params.from_date_timestamp));
    });

    app.get('/api/benchmarks/names', function (req, res) {
        console.log("fu");
        res.send([1.2, 2, 3]);
    });

    app.post('/cmd/launch', function (req, res) {
        launchBenchmark(req, res);
    });

    // create todo and send back all benchmarks after creation
    /*app.post('/api/benchmarks', function (req, res) {

     // create a todo, information comes from AJAX request from Angular
     Benchmark.create({
     text: req.body.text,
     done: false
     }, function (err, todo) {
     if (err)
     res.send(err);

     // get and return all the benchmarks after you create another
     getBenchmarkByName(res);
     });

     });*/

    // delete a todo
    /*app.delete('/api/benchmarks/:todo_id', function (req, res) {
     Benchmark.remove({
     _id: req.params.todo_id
     }, function (err, todo) {
     if (err)
     res.send(err);

     getBenchmarkByName(res);
     });
     });*/

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