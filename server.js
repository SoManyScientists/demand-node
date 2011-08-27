var http = require('http'),
    nko = require('nko')('0Fpe8yXwL+6WOR2s');
/*
* Module dependencies.
*/

var express = require('express');
var app = module.exports = express.createServer();

// Configuration

server_port = 80;

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  server_port = 3000;
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  res.render('index', {
    title: 'Express'
  });
});

app.listen(server_port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);