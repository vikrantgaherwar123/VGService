// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var express = require('express');
var http = require('http');
var config = require('./config/environment');

// Setup server
var app = express();
var server = require('http').createServer(app);

require('./routes')(app);


// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;


// http.createServer(function (req, res) {
//     res.writeHead(200, {'Content-Type': 'text/plain'});
//     res.end('Hello World!');
//   }).listen(8080);
//   console.log('Express server listening on %d, in %s mode', 8080);

// server.listen(3001, function () {
//     console.log('Express server listening on %d, in %s mode', 3001);
//   });
