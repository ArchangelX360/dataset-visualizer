/* Commands API routes */

var fs = require('fs');
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
    paramsArray.push("benchmarkname=" + parameters.benchmarkname.replace(/[^a-zA-Z0-9]/gi, ''));
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
    // FIXME: (node) warning: possible EventEmitter memory leak detected.
    // FIXME: Memory possible memory leak, we never shutdown the socket neither removing listeners

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

/* FOR TESTING ONLY */
var memcachedChild = null;
/* */

module.exports = function (router, io) {

    io.sockets.on('connection', function (socket) {
        console.log('Client connected with id : ' + socket.id);

        socket.on('authentication', function (benchmarkName) {
            console.log("Authenticate with : " + benchmarkName);
            clients[benchmarkName] = socket;
        });

        socket.on('disconnect', function () {
            console.log('Client disconnected with id : ' + socket.id);
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
            response = '[SUCCESS] Benchmarking "' + parameters.target + '" in progress...\n';
        } else {
            err = 'Please enter a valid Benchmark Name.';
        }
        utilities.sendResult(res, err, response);
    });


    /* FOR TESTING ONLY */

    router.get('/cmd/memcached', function (req, res) {
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
        utilities.sendResult(res, null, '[SUCCESS] Memcached is running on '
            + systemConfig.memcachedAddress + ':' + systemConfig.memcachedPort
            + ' by ' + systemConfig.memcachedUser + '.\n');
    });

    router.delete('/cmd/memcached', function (req, res) {
        var response = "";
        var err = null;
        if (memcachedChild) {
            kill(memcachedChild.pid);
            response = '[SUCCESS] Your memcached instance is killed.\n';
        } else {
            err = 'No instance to kill.';
        }
        utilities.sendResult(res, err, response);
    });
};