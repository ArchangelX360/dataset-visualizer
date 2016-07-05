module.exports = {

    /**
     * Send a formatted result object
     * @param res result of the request
     * @param err errors of the mongodb query
     * @param objects the mongodb results
     */
    sendResult: function (res, err, objects) {
        var data = {"errors": null, "results": null};
        if (err) {
            data.errors = '[ERROR] ' + err + '\n';
        } else {
            data.results = objects;
        }
        res.json(data);
    }

};