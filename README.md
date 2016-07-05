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

    node --max-old-space-size=16384 server.js

Then go to <http://localhost:5555> !

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

* a label _operationType_ (in our case it is the operation type INSERT, UPDATE, ...) which will separate your graphs
* a unique number _num_ which will be use to sort your entries
* a value _latency_ which is your measure

In order to make it work immediatly you need to have a measure that is only a number. (See [Candlestick section](#candlestick) for other type of measures)

#### I want to make Candlestick charts (boxplot) !<a name="candlestick"></a>

// **TODO : refact, revise explaination into a whole**

This section is about modifying some of our code to make it work with any kind of data you want to display.

In our benchmark, our measure value is an number, not multiple values, not an array BUT this can change.

 For example, you can fill your MongoDB database with object instead like this :

``` javascript
latency : {
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
            Object.keys(measureObj.latency).map(key => obj[key])
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
