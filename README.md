# Yahoo! Cloud Serving Benchmark Web Application

A web application which communicate with the visualisation part of Yahoo! Cloud Service Benchmark.

## Requirements

### Core programs

You will need Java 8 and MongoDB to use this application :

    sudo apt-get install openjdk-8-jre mongodb

### DB program

Of course you will need a DB to benchmark, we are going to use memcached :

    sudo apt-get install memcached

### YCSB supported version

You will also need YCSB "visualisation" version.

For now, the custom release will be included in
this repo. In the future, we hope YCSB will accept our pull-request.


## Configuration

You will find configuration files under _config/_

#### Storage database

You can configure your MongoDB URL in the _database.js_ file.

``` javascript
{
    localUrl: 'mongodb://localhost/db_name'
}
```

For now, only local MongoDB have been tested. But it should work fine with a remote one.

#### YCSB & benchmarked database

You can configure the absolute path of YCSB stuff in the  _system.js_ file.

``` javascript
{
    ycsbExecutable: '/absolute/path/to/ycsb/python/executable',
    ycsbRoot: '/absolute/path/to/ycsb/root/folder/',
    workloadFolder: '/absolute/path/to/ycsb/workload/folder/',
}
```

## Deployment

### NodeJS server modules installation

Go to folder where the file _package.json_ is located and execute:

    npm install
  
### Launch it !

You need to start the NodeJS server:

    node server.js

Then go to <http://localhost:5555> !

## Compatibility

### Database

YCSB "visualisation" version should be available for all kind of database regarding of its implementation.
It is currently tested only with memcached.

### Make it work with custom things

#### Custom db adapter

TODO

#### Other DB than MongoDB

TODO

## Limitations

### Makes YCSB a bit slower

This frontend slows YCSB a bit because of the real time DB hook.

It slows YCSB by **less than 10% operations by second**, tested on Workload A loads making an average of 15 tries.

