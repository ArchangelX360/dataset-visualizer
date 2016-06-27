var benchmarkSchema = require('./models/benchmark');
var nameSchema = require('./models/name');
var mongoose = require('mongoose');
var database = require('../config/database'); 			// load the database config
var child_process = require('child_process');
var systemConfig = require('../config/system'); 			// load the database config
var fs = require('fs');
var psTree = require('ps-tree');
var clients = {};
var memcachedChild = null;
/* FOR TESTING ONLY */

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
    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
    if (err) {
        res.send('[ERROR] ' + err + '.\n');
    } else {
        res.json(objects);
    }
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
        client.emit('exit', {message: 'child process exited with code ' + code});
    });

};

module.exports = function (app, io) {

    /* Command API */

    app.post('/cmd/launch', function (req, res) {
        var parameters = req.body;
        if (typeof parameters.benchmarkname != "undefined" && parameters.benchmarkname !== "") {
            var program = systemConfig.ycsbExecutable;
            var paramsArray = parseParameters(parameters);
            executeCommand(program, paramsArray, parameters.benchmarkname);
            res.send('[SUCCESS] Benchmarking "' + parameters.target + '" in progress...\n');
        } else {
            res.send('[ERROR] Please enter a valid Benchmark Name.\n');
        }
    });

    /* Benchmark API */

    // get a benchmark by name
    app.get('/api/benchmarks/:benchmark_name', function (req, res) {
        var Benchmark = mongoose.model('Benchmark', benchmarkSchema, req.params.benchmark_name);
        Benchmark
            .find(function (err, benchmarks) {
                apiReturnResult(res, err, benchmarks)
            });
    });

    // get benchmark results by operation type
    app.get('/api/benchmarks/:benchmark_name/:operation_type', function (req, res) {
        var Benchmark = mongoose.model('Benchmark', benchmarkSchema, req.params.benchmark_name);
        Benchmark
            .where('operationType', req.params.operation_type)
            .sort('createdAt')
            .find(function (err, benchmarks) {
                apiReturnResult(res, err, benchmarks)
            });
    });

    // get benchmark results by operation type from a specified date
    app.get('/api/benchmarks/:benchmark_name/:operation_type/:from_date_timestamp', function (req, res) {
        var Benchmark = mongoose.model('Benchmark', benchmarkSchema, req.params.benchmark_name);
        Benchmark
            .where('operationType', req.params.operation_type)
            .where('createdAt').gt(parseInt(req.params.from_date_timestamp))
            .sort('createdAt')
            .find(function (err, benchmarks) {
                apiReturnResult(res, err, benchmarks)
            });
    });

    // get all benchmark names
    app.get('/api/benchmarks/names', function (req, res) {
        var Name = mongoose.model('Name', nameSchema);
        Name.find(function (err, names) {
            apiReturnResult(res, err, names)
        });
    });

    // delete a benchmark
    app.delete('/api/benchmarks/:benchmark_name', function (req, res) {
        var Name = mongoose.model('Name', nameSchema);
        Name.db.db.dropCollection(req.params.benchmark_name, function (err, result) {
            if (err) {
                res.send(err);
            } else {
                res.send(result);
            }
        });
        Name.remove({
            name: req.params.benchmark_name
        }, function (err) {
            if (err) {
                res.send(err);
            }
        });
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
        res.send(files);
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
        res.send('[SUCCESS] Memcached is running on '
            + systemConfig.memcachedAddress + ':' + systemConfig.memcachedPort
            + ' by ' + systemConfig.memcachedUser + '.\n');
    });

    app.delete('/cmd/memcached', function (req, res) {
        var response = '[SUCCESS] Your memcached instance is killed.\n';
        if (memcachedChild)
            kill(memcachedChild.pid);
        else
            response = '[ERROR] No instance to kill.\n';
        res.send(response);
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

};