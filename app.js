//Tutorial: http://cwbuecheler.com/web/tutorials/2013
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var h5bp = require('h5bp');
var routes = require('./routes/index');
var users = require('./routes/users');
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;   //tutorial: http://zellwk.com/blog/crud-express-mongodb/
var assert = require('assert');
var url = 'mongodb://cnngen1:cmolmapb6@ds145315.mlab.com:45315/cnn_gen'; //TODO: make your password an environment variable
var db;
MongoClient.connect(url, function (err, database) {
    assert.equal(null, err);
    console.log("Connected correctly to server.");
    db = database;
    //database.close(); this was in the mongodb tutorial but not in the zellwk tutorial
});
var ObjectId = require('mongodb').ObjectID;
var app = express();

// view engine setup
app.set('public', path.join(__dirname, 'public'));
app.set('view engine', 'ejs');


var debug = require('debug')('CloudInfo:server');
var http = require('http');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3100');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
console.log('Server running on port ' + port);
/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}


/** Methods for preventing spam requests
 -CAPTCHA
 -timer between page load and form submission
 -maximum amount of processes allowed to take place on the server at once
 -but they could stall the server with this, so not recommended
 layout of website (bootstrap vs md?), security
 **/





// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(h5bp({
    root: __dirname + '/public'
}));
app.use(express.static(path.join(__dirname, 'public')));

//function sortLayer(a, b){  //a is one object, b is the other
//    //if a has a lesser value, make it be treated as a lower value, and vice versa
//    var varNames = ['C', 'Count', 'I', 'K', 'O', 'R', 'S'];
//    for (var i = 0; i < varNames.length; i++){
//        var currentVar = varNames[i];
//        if (a[currentVar] < b[currentVar]){
//            return -1;
//        }
//        else if (a[currentVar] > b[currentVar]){
//            return 1;
//        }
//    }
//    //if they make it here, they're identical so it doesn't matter what you return.
//    return -1;
//}

function isNumber(obj) {
    return !isNaN(parseFloat(obj))
}

function percentDifference(val1, val2){
    var numerator = val1 - val2;
    var denominator = (val1 + val2)/2;  //average of the two values
    return (numerator / denominator) * 100; //the 100 is to make it into a percentage
}

//Run with debug messages: set DEBUG=express:* & node app.js
//Alternatively, you can run the set command once and the node app.js will run with debug commands until you close the terminal
app.post('/sendFormData', function (req, res) {
    //Check to see if we already have it in the cache
    //req.body.fpgaBoard = JSON.parse(req.body.fpgaBoard);
    try {
        console.log('-1');
        console.log(req.body);
        var layerData = req.body.cnnSelect;
        layerData = JSON.parse(layerData);
        req.body.cnnSelect = layerData;
        layerData = req.body.cnnSelect.layers;
        layerData = JSON.stringify(layerData);
        //    arr3.sort(sortLayer);
        var finalCode = '';
        var uniqueNetwork = true;
        var savedNetwork;
        var validInput = true;
        var similarNetworks = [];
        var absDif = 0;
        //BEGIN CHECK INPUTS
        //checks inputs to make sure they are all the right format


        //END CHECK INPUTS
        db.collection('cached_generations').find({}, {code: 0}).toArray(function (err, results) {     //get all the cached combos but not the code b/c that would take too long
            //db.collection('cached_generations').find().toArray(function(err, results) {     //get all the cached combos

            console.log('0');
            if (err) {
                return console.log(err);
            }
            var compareStats = ['dsp', 'bram', 'bandwidth', 'bandwidthUnit', 'dspResources', 'dspResourceUnit', 'bramResources', 'bramResourceUnit', 'bandwidthResources', 'bandwidthResourceUnit'];
            loop1: for (var i = 0; i < results.length; i++) {   //loop through all the cached combos
                absDif = 0;
                console.log('1');
                console.log(results[i]);
                var currentNetwork = results[i];    //an object with the keys _id, layers, compareStats(above), and code.
                console.log('body');
                console.log(req.body);
                loop2: for (var j = 0; j < compareStats.length; j++) {  //compare only the compareStats instead of the json strings so then if you ever add/remove an attribute, you don't have to modify the entire database
                    console.log('2');
                    var currentStat = compareStats[j];
                    var currentValue = req.body[currentStat];
                    console.log('stat: ' + currentStat);
                    console.log('val: ');
                    console.log(currentValue);
                    //BEGIN make sure their inputs are valid
                    switch (currentStat) {  //server side checking of results
                        case 'dsp':
                        case 'bram':
                        case 'bandwidth':
                        case 'dspResources':
                        case 'bramResources':
                        case 'bandwidthResources':
                            if (!isNumber(currentValue)) {
                                validInput = false;
                                res.status(400);
                                res.send('Server understood the request, but request content was invalid. The value ' + currentValue + ' for the input "' + currentStat + '" is not a valid number');
                                break loop1;
                            }
                            break;
                        case 'bramUnit':
                            if (typeof currentValue != 'string' || currentValue != '18kbit' || currentValue != '36kbit') {
                                validInput = false;
                                res.status(400);
                                res.send('Server understood the request, but request content was invalid. The value ' + currentValue + ' for the input "' + currentStat + '" is not a valid unit');
                                break loop1;
                            }
                            break;
                        case 'bandwidthUnit':
                            if (!(typeof currentValue == 'string' && (currentValue == 'gbs' || currentValue == 'mbs' || currentValue == 'kbs'))) {
                                validInput = false;
                                res.status(400);
                                res.send('Server understood the request, but request content was invalid. The value ' + currentValue + ' for the input "' + currentStat + '" is not a valid unit or type');
                                break loop1;
                            }
                            break;
                        case 'dspResourceUnit':
                            if (!(typeof currentValue == 'string' && (currentValue == 'percent' || currentValue == 'units'))) {
                                validInput = false;
                                res.status(400);
                                res.send('Server understood the request, but request content was invalid. The value ' + currentValue + ' for the input "' + currentStat + '" is not a valid unit');
                                break loop1;
                            }
                            if (currentValue == 'percent' && parseFloat(req.body['dspResources']) > 100) {
                                validInput = false;
                                res.status(400);
                                res.send('Server understood the request, but request content was invalid. The value ' + currentValue + ' for the input "' + currentStat + '" cannot be greater than 100.');
                                break loop1;
                            }
                            break;
                        case 'bramResourceUnit':    //check to see if it is not a string or it is not one of three values
                            if (!(typeof currentValue == 'string' && (currentValue == 'percent' || currentValue == '18kbit' || currentValue == '36kbit'))) {
                                validInput = false;
                                res.status(400);
                                res.send('Server understood the request, but request content was invalid. The value ' + currentValue + ' for the input "' + currentStat + '" is not a valid unit');
                                break loop1;
                            }
                            if (currentValue == 'percent' && parseFloat(req.body['bramResources']) > 100) {
                                validInput = false;
                                res.status(400);
                                res.send('Server understood the request, but request content was invalid. The value ' + currentValue + ' for the input "' + currentStat + '" cannot be greater than 100.');
                                break loop1;
                            }
                            break;
                        case 'bandwidthResourceUnit':
                            if (!(typeof currentValue == 'string' && (currentValue == 'percent' || currentValue == 'gbs' || currentValue == 'mbs' || currentValue == 'kbs'))) {
                                validInput = false;
                                res.status(400);
                                res.send('Server understood the request, but request content was invalid. The value ' + currentValue + ' for the input "' + currentStat + '" is not a valid unit or type');
                                break loop1;
                            }
                            if (currentValue == 'percent' && parseFloat(req.body['bandwidthResources']) > 100) {
                                validInput = false;
                                res.status(400);
                                res.send('Server understood the request, but request content was invalid. The value ' + currentValue + ' for the input "' + currentStat + '" cannot be greater than 100.');
                                break loop1;
                            }
                            break;
                    }
                    //END making sure their inputs are valid

                    var currentLayers = currentNetwork.cnnSelect.layers;
                    if (absDif == 0 && currentValue == currentNetwork[currentStat]) {  //if it's not equal, then go to the next object in the cache
                        console.log('3');
                        if (j == compareStats.length - 1) {  //if it's at the last item and hasnt broken, then all comparestats match
                            console.log('4');
                            if (layerData == JSON.stringify(currentLayers)) {    //if the layerdata for the user submittd project equals layers of cahce object...
                                console.log('5');
                                uniqueNetwork = false;
                                savedNetwork = currentNetwork;
                                break loop1;    //stop looping through the cached networks because you already found the one you need
                            }
                        }
                    }

                    //else if (absDif <=5){    //if the absdif isn't greater than 5 then it can still be considered similar
                    //    if (j == compareStats.length - 1) {
                    //        if (layerData.length != currentLayers.length){
                    //            break;  //can't be so different
                    //        }
                    //        //cnnSelect.layers to get array of layers
                    //        var oneWrong = false;
                    //        for (var layerCount = 0; layerCount <= layerData.length; layerCount++) {    //loop through all the layers of the real array of layers
                    //            if (JSON.stringify(layerData[layerCount]) != JSON.stringify(currentLayers)){
                    //                if (oneWrong){  //then this must be the second layer it got wrong, so disqualify this network
                    //                    break loop2;
                    //                }
                    //                oneWrong = true;
                    //            }
                    //        }
                    //        similarNetworks.push(currentNetwork);  //if it made it here then absDif <=5 and the layers aren't too different, so send it over
                    //    }
                    //    else {
                    //        absDif += percentDifference(currentValue, currentNetwork[currentStat]);
                    //    }
                    //}


                    else {
                        console.log('7');
                        break; //don't use .each for looping or else using break will be more complicated
                    }
                }
            }
            // if it makes it here, then it hasn't returned anything which means that no matches were found.
            console.log('8');
            if (uniqueNetwork && validInput) {   //then no match in the cache was found and new verilog code should be generated.
                //GENERATE CODE HERE
                //finalCode = whatever is generated
                console.log('9');
                req.body.code = finalCode;  //the generated code
                db.collection('cached_generations').insertOne(    //add this combination to the cache
                    req.body
                );
                res.send(JSON.stringify({
                    "networks": req.body.code,
                    "type": "unique"
                }));            }
            else if (absDif == 0 && !uniqueNetwork && validInput) {
                //get the code for this cached project and make it equal to the code for the user project
                db.collection('cached_generations').find({"_id": savedNetwork._id}, {
                    code: 1,
                    _id: 1
                }).toArray(function (err, results) {     //get all the cached combos
                    console.log('6');
                    finalCode = results[0].code;
                    res.send(JSON.stringify({
                        "networks":finalCode,
                        "type": "cached"
                    }));
                });
            }

            else if (absDif <= 5 && !uniqueNetwork && validInput){  //then that means that we've found similar networks
                res.send(JSON.stringify({
                    "networks": similarNetworks,
                    "type": "similar"
                }));
            }
            //res.end();
        });

        console.log('after async');

        /**!!!!!!!!!!!!!!!!WARNING: Due to the asynchronous nature of MongoDB, this code below will run right after the first time the db.collection.find function
         * is called, not waiting for any of the code inside to finish. That means that the code below will run before before you even start looping through
         * the resulting documents you get from the first db call. If you want this to run after all the db stuff is done,
         * place your code before the closing brace of the first db.collections.find call. !!!!!!!!!!!!!!!!!!!!
         **/

        //***ACCESSING VARIABLES FROM THE REQUEST***///
        var fileString = '';
        //fileString += 'Board: ' + req.body.fpgaBoard.Board; //only if they have a predefined board
        fileString += 'DSP: ' + req.body.dsp;
        fileString += '\nBRAM: ' + req.body.bram;
        fileString += '\nUnit_Size: ' + req.body.bramUnit;
        fileString += '\nBandwidth: ' + req.body.bandwidth;
        fileString += '\nBandwidth Unit: ' + req.body.bandwidthUnit;
        fileString += '\nTarget Clock Rate: ' + req.body.tcr;
        fileString += '\nDSP Resource Usage Amount: ' + req.body.dspResources;
        fileString += '\nDSP Resource Unit: ' + req.body.dspResourceUnit;
        fileString += '\nBRAM Resource Usage Amount: ' + req.body.dspResourceUnit;
        fileString += '\nBRAM Resource Unit: ' + req.body.dspResourceUnit;
        fileString += '\nBandwidth Resource Usage Amount: ' + req.body.dspResourceUnit;
        fileString += '\nBandwidth Resource Unit: ' + req.body.dspResourceUnit;
        fileString += '\nCNN Layers: ' + req.body.cnnSelect.layers; //this is how you access them. see below code to see how you view their contenets
        fileString += '\nHere is what those objects above look like: \n' + JSON.stringify(req.body.cnnSelect.layers, null, 4);  //the null 4 is to space out the printed object so it's prettier

        fs.writeFile("results", fileString, function (err) {   //writes "Hello world!" to results file in Network Generator Site directory
            if (err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        });
    }
    catch(err){
        res.status(500);
        res.send('Internal server error');
    }
});

//app.use('/', routes);
//app.use('/users', users);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.sendFile(path.join(__dirname + '/public/404.html'));
        //res.render('error', {
        //  message: err.message,
        //  error: err
        //});
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.sendFile(path.join(__dirname + '/public/404.html'));
    //res.render('error', {
    //  message: err.message,
    //  error: {}
    //});
});

module.exports = app;