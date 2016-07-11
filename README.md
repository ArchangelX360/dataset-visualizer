# Yahoo! Cloud Serving Benchmark Web Application

A web application which communicate with the visualisation part of Yahoo! Cloud Service Benchmark.

## Requirements

### Core programs

**WARNING: We assume that nodejs and npm are already installed on your machine**

You will need Java 8 and MongoDB to use this application :

    sudo apt-get install openjdk-8-jre mongodb

### DB program

You will need a DB to benchmark, we are going to use memcached :

    sudo apt-get install memcached

### YCSB supported version

You will also need YCSB "visualisation" version.

For now, the custom release will be included in
this repo. In the future, we hope YCSB will accept our pull-request.

## Configuration

### Storage database

You can configure your MongoDB URL in the _config/database.js_ file.

Here's the general config file with placeholders:

``` javascript
var urls = {
    localUrl: 'mongodb://localhost/<my_db_name>',
    remoteUrl : 'mongodb://[username:password@]host1[:port1][,host2[:port2],...[,hostN[:portN]]][/[database][?options]]'
};

module.exports = {
    url: urls.<my_url_attribute>
};

```

See [MongoDB Documentation](https://docs.mongodb.com/manual/reference/connection-string/#standard-connection-string-format]) for connection string format explainations.

#### Local configuration example

Here's an example of a local configuration:

``` javascript
var urls = {
    localUrl: 'mongodb://localhost/dbMeasurements', // our DB name is dbMeasurements
};

module.exports = {
    url: urls.localUrl // we export the local url for the application
};

```

#### Remote configuration example

If you want to have a remote instance you need to :
* authorize your remote MongoDB instance to accept remote connections.
* adapt the _remoteUrl_ attribute
* export _urls.remoteUrl_

This is an example of a remote configuration:

``` javascript
var urls = {
    remoteUrl : 'mongodb://node:nodeuser@mongo.onmodulus.net:27017/uwO3mypu'
};

module.exports = {
    url: urls.remoteUrl // we export the remote url for the application
};

```

### YCSB & benchmarked database

Some more configuration are available in the  _config/system.js_ file.

``` javascript
var ycsbRoot = "/home/titouan/Documents/ycsb-web-app/ycsb-0.11.0-custom-release/";

module.exports = {
    countersCollectionName: 'counters',

    ycsbExecutable: ycsbRoot + 'bin/ycsb',
    ycsbPythonExecutable: ycsbRoot + 'bin/ycsb',
    useBindingFile: true,
    ycsbBindingsFile: ycsbRoot + 'bin/bindings.properties',
    workloadFolder: ycsbRoot + 'workloads/',
};
```

You will find information on these variables in the file's comments.

### Client configuration

You might want to configure the charts view, here's a section for you.

#### Explainations

You can set the _MAX\_POINTS_ variables, this variable is based on your browser and PC performance.

MongoDB is grouping value and making averages to optimise the view and make nodejs serve results faster. This grouping process reduces measurements' precision. For example, you would get 5 buckets of average each based on 4 successive values instead of getting 20 measures:

``` javascript
// MongoDB aggregation illustration

[15,15,15,15,0,10,10,0,10,20,25,25,0,0,0,0,10,5,10,15]  // Original array
==> [15, 5, 20, 0, 10]                                  // Aggregated array
```

**// TODO : do a illustration as a map reduce illustration in docs**

 The better your computer and browser are, the higher you can set the _MAX\_POINTS_ value and the smaller these buckets will be. You will have a more precise dataset.

#### Variable location

 The variable is located in _public/stats/stats.controller.js_.

``` javascript
/** CONFIGURATION VARIABLES **/
$scope.MAX_POINTS = 20000; // maximal number of points you can get from MongoDB
```

## Deployment

### NodeJS server modules installation

Go to the root folder of the application where the file _package.json_ is located and execute:

    npm install


### Client modules installation

Go to the _public_ folder where the file _package.json_ is located and execute:

    npm install

### Execution rights

Be sure to have execution rights on the app folder otherwise launching benchmarks won't work!
  
### Launch it !

You need to start the NodeJS server:

    node --max-old-space-size=16384 server.js

Then go to <http://localhost:5555> !

**NOTE:** adapt the _max-old-space-size_ regarding your machine.

## Compatibility

### Database

YCSB "visualisation" version should be available for all kind of database regarding of its implementation.
It is currently tested only with memcached.

### Make it work with custom things

// **TODO : refact, revise explaination into a whole**

#### What about not YCSB ?

You may want to use our visualisation with another benchmark system.

You need to follow some points to be able to do so.

##### MongoDB Population

Your benchmark measurement should have:

* a label _label_ (in our case it is the operation type INSERT, UPDATE, ...) which will separate your graphs
* a unique number _num_ which will be use to sort your entries
* a value _measure_ which is your measure

In order to make it work immediatly you need to have a measure that is only a number. (See [Candlestick section](#candlestick) for other type of measures)

#### I want to make Candlestick charts (boxplot) !<a name="candlestick"></a>

// **TODO : refact, revise explaination into a whole**

This section is about modifying some of our code to make it work with any kind of data you want to display.

In our benchmark, our measure value is an number, not multiple values, not an array BUT this can change.

 For example, you can fill your MongoDB database with object instead like this :

``` javascript
measure : {
    open: 50.45,
    high: 50.93,
    low: 46.61,
    close: 47.24
}
```

You will need to change a few lines of code into our codebase to make it work.

The _convertToSerie_ function which process the storage DB data and make it understandable for Highcharts :

``` javascript
function convertToSerie(rawValues) {
    return rawValues.map(function (measureObj) {
        return [
            measureObj.num,
            Object.keys(measureObj.measure).map(key => obj[key])
        ]
    });
}
```

And finally, add a type to the series:

``` javascript
 series: [
    {
        type : 'candlestick',
        ...
    },
    ...
}
```

Be careful to the _getAverage_ function which will make average of all your *open* values. You might want to modify it too.



// **TODO : change name of fields in YCSB/Mongo to be more generic**

#### Custom db adapter

// **TODO**

#### Other DB than MongoDB

// **TODO**

## Limitations

### Makes YCSB a bit slower

This frontend slows YCSB a bit because of the storage DB insertion.


// **TODO: determine how much & fill this !**

### Linear loss of accurary

Our application use a grouping system to handle millions of values.

// **TODO: fill this !**
