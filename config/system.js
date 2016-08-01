var ycsbRoot = "/home/titouan/Documents/ycsb-web-app/ycsb-0.11.1-custom-release/"; // FrontendConcurrencyMap version

module.exports = {
    countersCollectionName: 'counters',
    /* The name of the MongoDB collection where you store counters of collections */

    /* All following parameters are optionnals if you don't use "Launching Benchmark" or "Workloads Management views */
    ycsbExecutable: ycsbRoot + 'bin/ycsb',
    /* Absolute path to the YCSB executable you want to use */
    useBindingFile: false,
    /* Parse binding.properties to infer available databases instead of the python script */
    ycsbPythonExecutable: ycsbRoot + 'bin/ycsb',
    /* Absolute path to the YCSB python script (only needed if useBindingFile set to false) */
    ycsbBindingsFile: ycsbRoot + 'bin/bindings.properties',
    /* Absolute path to the binding.properties file (only needed if useBindingFile set to true) */
    workloadFolder: ycsbRoot + 'workloads/',
    /* Absolute path to the workloads folder */
    dbDumpsFolder: '/home/titouan/Documents/ycsb-web-app/public/dumps/',
    /* Absolute path to the db dumps folder */

    /* FOR EVALUATION ONLY */
    evaluationsLocation: '/home/titouan/Documents/ycsb-web-app/public/evaluations/'
};
