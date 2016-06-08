var Benchmark = require('./models/benchmark');

function getBenchmarks(res) {
    Benchmark.find(function (err, benchmarks) {

        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
        if (err) {
            res.send(err);
        }
        res.json(benchmarks); // return all benchmarks in JSON format
    });
}
;

module.exports = function (app) {

    // api ---------------------------------------------------------------------
    // get all benchmarks
    app.get('/api/benchmarks', function (req, res) {
        // use mongoose to get all benchmarks in the database
        getBenchmarks(res);
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