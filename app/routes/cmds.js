/* Commands API routes */

var debug = require('debug')('cmd');
var psTree = require('ps-tree');
var utilities = require('../utilities');
var child_process = require('child_process');
var systemConfig = require('../../config/system');
var clients = {};

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
    paramsArray.push("frontend.collection.benchmark=" + parameters.benchmarkname.replace(/[^a-zA-Z0-9]/gi, ''));
    paramsArray.unshift(parameters.db);
    paramsArray.unshift(parameters.target);

    if (parameters.status) {
        paramsArray.push('-s');
    }

    return paramsArray;
};

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
 * Execute a command on the server and send result only to the user that need the console feedback
 * @param program the program to execute
 * @param params parameters for child_process spawn command
 * @param benchmarkName the benchmark name (identify only users that need the console feedback)
 */
var executeCommand = function (program, params, benchmarkName) {
    var child = child_process.spawn(program, params);
    var client = clients[benchmarkName]; // Only emitting on the right client

    if (typeof client !== "undefined") {
        client.removeAllListeners('kill');
        client.removeAllListeners('exit');
    }

    client.emit('begin');

    client.on('kill', function () {
        kill(child.pid);
        debug("Client killed the benchmark.");
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

module.exports = function (router, io) {

    io.sockets.on('connection', function (socket) {
        debug('Client connected with id : ' + socket.id);

        socket.on('authentication', function (benchmarkName) {
            clients[benchmarkName] = socket;
            debug("Authenticate with : " + benchmarkName);
        });

        socket.on('disconnect', function () {
            debug('Client disconnected with id : ' + socket.id);
        });
    });

    router.post('/cmd/launch', function (req, res) {
        var parameters = req.body;
        var err = null;
        var response = null;
        if (typeof parameters.benchmarkname != "undefined" && parameters.benchmarkname !== "") {
            var program = systemConfig.ycsbExecutable;
            var paramsArray = parseParameters(parameters);
            executeCommand(program, paramsArray, parameters.benchmarkname);
            response = 'Benchmarking "' + parameters.target + '" launched !';
        } else {
            err = 'Please enter a valid Benchmark Name.';
        }
        utilities.sendResult(res, err, response, 400);
    });
};