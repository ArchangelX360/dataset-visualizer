var homeFolder = "/home/<your_user>/Documents/dataset-visualizer-0.1-release/";
var ycsbRoot = homeFolder + "ycsb-0.10.0-visualization-release/"; // FrontendConcurrencyMap version

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
    importFileFolder: ycsbRoot + 'imports/',
    /* Absolute path to the import files folder */
    dbDumpsFolder: homeFolder + 'public/dumps/',
    /* Absolute path to the db dumps folder */

    /* FOR EVALUATION ONLY */
    evaluationsLocation: homeFolder + 'public/evaluations/'
};
