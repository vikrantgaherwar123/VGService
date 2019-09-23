/**
 * Main application routes
 */

'use strict';
var express = require('express');
var cookieParser = require('cookie-parser');
var session = require('express-session');
//var errors = require('./components/errors');
var bodyParser = require('body-parser');
module.exports = function (app) {
    app.use(cookieParser());  
    app.use(session({ secret: '1234567890PayNext' }));
    //app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({limit: '40mb', extended: true}));
  app.use(bodyParser.json({limit: '40mb'}));
    //Insert routes below    
    app.use('/MIS_SERVICE', require('./api'));
   
   
};
