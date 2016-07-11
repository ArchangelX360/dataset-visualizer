var ycsbRoot = "/home/titouan/Documents/ycsb-web-app/ycsb-0.11.0-custom-release/";

module.exports = {
    ycsbExecutable: ycsbRoot + 'bin/ycsb',
    ycsbPythonExecutable: ycsbRoot + 'bin/ycsb',
    useBindingFile: true,
    ycsbBindingsFile: ycsbRoot + 'bin/bindings.properties',
    workloadFolder: ycsbRoot + 'workloads/',
    countersCollectionName: 'counters',
    memcachedExecutable: '/usr/bin/memcached',
    memcachedUser: 'titouan',
    memcachedAddress: '127.0.0.1',
    memcachedPort: 11211,
    memcachedMaxMemory: 10240
};
