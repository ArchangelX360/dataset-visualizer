# Web Dataset Visualizer

## Presentation

Originally design for Yahoo! Cloud Serving Benchmark, this web application displays measures stored in a MongoDB database. It could be used for any kind of data and series type but is mostly used for benchmark measures visualization.

<p align="center">
  <img src="/doc/images/archi-app.png" />
</p>
<p align="center">
  <b>Place in the overall project architecture</b>
</p>


It supports large dataset (millions of points) and achieves view optimization to display them efficiently. Here's some chart examples:

<p align="center">
  <img src="/doc/images/xy.png" />
</p>
<p align="center">
  <b>XY chart example</b>
</p>

<p align="center">
  <img src="/doc/images/candlestick.png" />
</p>
<p align="center">
  <b>Candlestick example</b>
</p>

This application currently has a full YCSB support, you can launch benchmark using YCSB parameters and make your own workload with a Web UI.

For now, only XYplot and Candlestick are supported. However, implementing a new series type is very easy! See [Create your own conversion adapter](#own-conversion)

## Getting started

### Core programs

**WARNING: We assume that nodejs and npm are already installed on your machine**

You will need Java >=8 and MongoDB >=2.6.10 to use this application :

    sudo apt-get install openjdk-8-jre mongodb

### YCSB specific requirements

#### DB program

You will need a DB to benchmark, we are going to use memcached :

    sudo apt-get install memcached

#### YCSB supported version

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
    dbDumpsFolder: '/home/titouan/Documents/ycsb-web-app/public/dumps/'
    evaluationsLocation: '/home/titouan/Documents/ycsb-web-app/public/evaluations/'
};
```

You will find information on these variables in the file's comments.

### Client configuration

You might want to configure the charts view, here's a section for you. This configuration is optional for YCSB users.

#### Chart view optimization

If you want to make a large number of measure, our client won't be able to display all measures. Our client has an automatic aggregating process to overcome the problem.

##### Explainations<a name="aggregation-explaination"></a>

MongoDB is grouping value and making averages to optimise the view and make NodeJS serve results faster. This grouping process reduces measurements' precision. For example, you would get 3 buckets of average each based on 3 successive values instead of getting 9 measures:

<p align="center">
  <img src="/doc/images/mongodb-agg.png" />
</p>
<p align="center">
  <b>Simple illustration of MongoDB aggregation process</b>
</p>

 The better your computer and browser are, the higher you can set the _MAX\_POINTS_ value and the smaller these buckets will be. You will have a more precise dataset.

#### Label definition

In order to generate a chart, you need to declare the different label you will have in your storage database and which Highcharts series type you want to use for this label.

For example, we have these documents in your storage database:
``` javascript
[
    {
        label: "INSERT",
        num: 0,
        measure: 4854
    },
    {
        label: "INSERT",
        num: 2,
        measure: 1254
    },
    {
        label: "CLEANUP",
        num: 0,
        measure: 105
    },
    {
        label: "INSERT",
        num: 3,
        measure: 45
    },
    ...
]
```

We need to declare the "INSERT" and "CLEANUP" label like that:


``` javascript
...
$scope.labelTypeMap = {
    "INSERT" : "line",
    "CLEANUP" : "line",
};
...
```

The visualization view will know display two charts, a cleanup and an insert one and automatically filled it with the corresponding data.

#### Variables' location

 The variable is located in _public/stats/stats.controller.js_.

``` javascript
/** CONFIGURATION VARIABLES **/
$scope.MAX_POINTS = 20000; /* maximal number of points you can get from MongoDB */
$scope.showAverage = true; /* show average series or not */
$scope.labelTypeMap = {
    "INSERT" : "line",
    "READ" : "line",
    "UPDATE" : "line",
    "READ-MODIFY-WRITE" : "line",
    "CLEANUP" : "line",
    "SCAN" : "line",
};
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

**NOTE:** adapt the _max-old-space-size_ relying on your machine performances.

## What about not using YCSB ?

At first, our vizualizer was made for YCSB, but during the development we thought it would be great for it to support any kind of benchmarking software or more generally every software that output data.

These following points explain how to use our visualizer without YCSB.

### MongoDB Population

First, your software should be able to populate a MongoDB database.

Each benchmark, group of measurement should be on a separate collection.
Inside those collections, your documents have to respect the following scheme :

* a string label _label_ (in our case it is the operation type INSERT, UPDATE, ...) which will separate your graphs
* a unique number _num_ which will be use to sort your entries
* an object _measure_ which is your measure

This last attribute of your documents can be at least whatever you want. This can be an object with fields, a single value, an array, etc. We will see how we handle this on the client side.

#### Example: our YCSB scheme

``` javascript
[
    {
        label: "INSERT",
        num: 0,
        measure: 4854
    },
    {
        label: "INSERT",
        num: 2,
        measure: 1254
    },
    {
        label: "CLEANUP",
        num: 0,
        measure: 105
    },
    {
        label: "INSERT",
        num: 3,
        measure: 45
    },
    ...
]
```

### MongoDB/Client interface

Now that your MongoDB DB is filled with bunch of your measurements, you need to make the client understand what is your scheme. (See [Supported Scheme](#supported-scheme) to know if you need to follow this section)

For that, you will need to create a new _convertToSerie_ adapter.

#### Create your own conversion adapter<a name="own-conversion"></a>
Your _convertToSerie_ adapter will transform your DB scheme into an array of values understandable by Highcharts library.

So, in order to make your DB scheme work with the client you will need to:

* check if Highcharts library can display your type of data
* create a new _convertToSerie_ adapter function to match Highcharts way of displaying the data
* add a switch case to the _convertToSerieByChartType_ switch function to link the highchart type to your custom adapter
* add your label and series type into the _$scope.labelTypeMap_ map.

See the following [Candlestick Example](#candlestick-example) to understand where and how to do it.

#### Example: candlestick support implementation<a name="candlestick-example"></a>

YCSB produce a single value measure which is the latency. To support candlestick, we need to handle a measure object a bit more complex which looks like the following:

``` javascript
measure : {
    open: 50.45,
    high: 50.93,
    low: 46.61,
    close: 47.24
}
```

As explain, we need to design a new _convertToSerie_ adapter which process the storage DB data and make it understandable for Highcharts:

``` javascript
// stats.controller.js

/**
 * Convert stored raw values from YCSB to Highchart formatting for candlestick series
 *
 * @param rawValues YCSB raw DB values
 * @returns {*} Highchart formatted data
 */
function convertToCandlestickSerie(rawValues) {
    return rawValues.map(function (measureObj) {
        return [
            measureObj.num,
            measureObj.measure.open,
            measureObj.measure.high,
            measureObj.measure.low,
            measureObj.measure.close
        ]
    });
}
```

Then we need to tell our client to use this adapter when candlestick type is selected so we add a switch entry to the _convertToSerieByChartType_ switch function:

``` javascript
// stats.controller.js

/**
 * Select the conversion function based on the series type
 *
 * NOTE : you can add you own convertToSerie functions to support any series type!
 *
 * @param seriesType
 * @param rawValues
 * @returns {*}
 */
function convertToSerieByChartType(seriesType, rawValues) {
    var serie;
    switch (seriesType) {
        case "line":
            serie = convertToLineSerie(rawValues);
            break;
        case "candlestick":
            serie = convertToCandlestickSerie(rawValues);
            break;
        default:
            throw "Series type not supported yet, see our documentation to know how to implement it.";
            break;
    }
    return serie;
}
```

Then, we need to declare our label as a "candlestick" type series:

``` javascript
// stats.controller.js

$scope.labelTypeMap = {
    "AAPL Stock Price" : "candlestick"
};
```

Now, we might want to disable the average series by setting the _$scope.showAverage_ to false, otherwise the average function will make average of our first value which is the *open* values, this doesn't make any sense. You still could modify the average functions if you really want the average series.

Finally, we want to support very large dataset so we added a new aggregating function within the switch of the aggregating route, *see _app/routes/benchmarks.js_ for more details*.

### Supported Scheme <a name="supported-scheme"></a>

The application supports only two schemes for the moment which are:

* The simple line scheme with *Highchart* "line" type

``` javascript
{
        label: "mylabel",
        num: 0,
        measure: 105
},
...
```

* The candlestick scheme with *Highchart* "candlestick" type

``` javascript
{
    label: "mylabel",
    num: 0,
    measure: {
        open: 50.45,
        high: 50.93,
        low: 46.61,
        close: 47.24
    }
}
```

## Limitations

### Linear loss of accuracy

As we see in [MongoDB Aggregation Explaination Section](#aggregation-explaination), our application uses an aggregating process to handle millions of values. This aggregation process is reducing the precision of our displayed charts.

The precision reduction grow linearly when your benchmark points are increasing. The coefficient of this linear reduction is the value the user sets based on his computer performances. We have the following equation:

<p align="center">
  <img src="/doc/images/bucket-eq.png" />
</p>
<p align="center">
  <b>Bucket size precision equation</b>
</p>

### Almost stuck with MongoDB

You could rebuild the entire NodeJS MongoDB API to make it work with another DB but it wasn't our goal to achieve this compatibility.

### Highcharts library

Highcharts library is a proprietary software, it is allowed to use it for a personal website, a school site or a non-profit organisation which suited our case. However, it is a strong limitation for our application users. 

As charts are handled by an AngularJS directive, we could plug another chart library by creating another directive to overcome this limitation. This new library would need functions to create, delete or modify series after a chart generation in order to work with our implementation.

## What to do next?
 
We are aware that improvements could be done such as:

* Better current window average
* Use objects instead of arrays for Highcharts series' data which would improve the chart type support drastically
* Removal of Highcharts library by softer licence library
* Simplify the aggregation process of MongoDB to make it more flexible