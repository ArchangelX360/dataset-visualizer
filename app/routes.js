var benchmarkSchema = require('./models/benchmark');
var mongoose = require('mongoose');
var child_process = require('child_process');

function getBenchmarks(res, benchmarkName) {
    var Benchmark = mongoose.model('Benchmark', benchmarkSchema, benchmarkName);
    Benchmark.find(function (err, benchmarks) {

        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
        if (err) {
            res.send(err);
        }
        res.json(benchmarks);
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

        executeCommandStr(cmd);
        res.send('[SUCCESS] Benchmarking "' + params.target + '" in progress...\n');
    } else {
        res.send('[ERROR] Please enter a valid Benchmark Name.\n');
    }
}

function executeCommandStr(cmd) {
    var child = child_process.exec(cmd);
    child.stdout.on('data', function (data) {
        console.log('stdout: ' + data + '\n');
        io.emit('stdout', {message: data + '\n'});
    });

    child.stderr.on('data', function (data) {
        console.log('stderr: ' + data + '\n');
        io.emit('stderr', {message: data + '\n'});
    });

    child.on('exit', function (code) {
        console.log('child process exited with code ' + code + '\n');
        io.emit('exit', {message: 'child process exited with code ' + code + '\n'});
    });
}

module.exports = function (app) {

    // api ---------------------------------------------------------------------
    // get one benchmark by name
    app.get('/api/benchmarks/:benchmark_name', function (req, res) {
        // use mongoose to get all benchmarks in the database
        getBenchmarks(res, req.params.benchmark_name);
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
     getBenchmarks(res);
     });

     });*/

    // delete a todo
    /*app.delete('/api/benchmarks/:todo_id', function (req, res) {
     Benchmark.remove({
     _id: req.params.todo_id
     }, function (err, todo) {
     if (err)
     res.send(err);

     getBenchmarks(res);
     });
     });*/

    // application -------------------------------------------------------------
    app.get('*', function (req, res) {
        res.sendFile(__dirname + '/public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
};