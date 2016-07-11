module.exports = {

    /**
     * Send a formatted result object
     * @param res result of the request
     * @param err errors of the mongodb query
     * @param objects the mongodb results
     * @param errorCode request error code if different than an internal error
     */
    sendResult: function (res, err, objects, errorCode) {
        if (err) {
            res.status(errorCode || 500).json(err);
            return;
        }
        res.json(objects);
    }
};