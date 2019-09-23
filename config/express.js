/**
 * Express configuration
 */

'use strict';
var express = require('express');

var morgan = require('morgan');
var compression = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var errorHandler = require('errorhandler');
var path = require('path');
var config = require('./environment');
var fs =  require('fs');


module.exports = function(app) {
  var env = app.get('env');

  
  //app.set('views', config.root + '/server/views');
  //app.engine('html', require('ejs').renderFile);
  //app.set('view engine', 'html');
  app.set('superSecret', config.secrets.session); // secret variable
 
  app.use(compression());
  // app.use(bodyParser.urlencoded({ extended: false }));
  // app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({limit: '40mb', extended: true}));
  app.use(bodyParser.json({limit: '40mb'}));
  app.use(methodOverride());
  app.use(cookieParser());
  
  /*app.use(function (req, res, next) {
    var fs = require('fs');
    var util = require('util');
    var logFile = fs.createWriteStream('log.txt', { flags: 'a' });
    // Or 'w' to truncate the file every time the process starts.
    var logStdout = process.stdout;

    console.log = function () {
      logFile.write(util.format.apply(null, arguments) + '\n');
      logStdout.write(util.format.apply(null, arguments) + '\n');
    }
    //console.error = console.log;
    next();
  });*/
  

  //var accessLogStream = fs.createWriteStream(path.join(config.log, 'access.log'), {flags: 'a'});
  //app.use(morgan('combined', {stream: accessLogStream}));

  //const winston = require('winston')
  //app.use(winston.log('info', 'Hello log files!', {stream: accessLogStream}));


  if ('production' === env) {
    //app.use(favicon(path.join(config.root, 'public', 'favicon.ico')));
    //app.use(express.static(path.join(config.root, 'public')));
    app.set('appPath', config.root + '/public');
    app.use(morgan('dev'));
  }

  if ('development' === env || 'test' === env) {
  //  app.use(require('connect-livereload')());
    //app.use(express.static(path.join(config.root, '.tmp')));
  //  app.use(express.static(path.join(config.root, 'client')));
  //  app.set('appPath', 'client');
    app.use(morgan('dev'));
    app.use(errorHandler()); // Error handler - has to be last
  }
};