// set up ======================================================================
var http = require('http');
var express = require('express');
var app = express(); 						// create our app w/ express
var port = process.env.PORT || 5555; 				// set the port
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var MongoClient = require('mongodb').MongoClient;
var databaseConfig = require('./config/database');

var db;

app.use(express.static(__dirname + '/public')); 		// set the static files location /public/img will be /img for users
app.use(morgan('dev')); // log every request to the console
app.use(bodyParser.urlencoded({'extended': 'true'})); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({type: 'application/vnd.api+json'})); // parse application/vnd.api+json as json
app.use(methodOverride('X-HTTP-Method-Override')); // override with the X-HTTP-Method-Override header in the request

// Initialize connection once
MongoClient.connect(databaseConfig.url, function (err, database) {
    if (err) throw err;

    db = database;

    // routes
    require('./app/routes/workloads.js')(app);
    require('./app/routes/cmds.js')(app, io);
    require('./app/routes/benchmarks.js')(app, db);
    require('./app/routes/databases.js')(app);

    // listen (start app with node server.js)
    server.listen(port);
    console.log("App listening on port " + port);
});
