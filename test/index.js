var test = require('tap').test;
var nock = require('nock');
var Monitor = require('../');
var _ = require('lodash');
var express = require('express');
var http = require('http');



// Test Helpers

var start = function(monitor){
  var stats = {
    history: [],
    counts: {
      pong: 0,
      drop: 0,
      connection: 0,
      disconnection: 0
    }
  };

  _.each(_.keys(stats.counts), function(type){
    monitor.on(type, function(){
      stats.counts[type] += 1;
      stats.history.push(type);
    });
  });

  monitor.start();

  return function(f){
    monitor.stop();
    monitor.removeAllListeners();
    return stats;
  };
};

var check_counts = function(t, stats, counts_expected){
  _.each(_.keys(stats.counts), function(type, i){
    t.equal(stats.counts[type], counts_expected[i], type + ' count');
  });
};

var check_history = function(t, stats, history){
  t.deepEqual(stats.history, history, 'Monitor history');
};

var uri = 'http://localhost:9333';



// Tests

test('uri-monitor issues HTTP GET requests against a given uri.', function(t){
  t.plan(2);
  var response = nock(uri).get('/').reply(200);
  var monitor = Monitor(uri);
  var stop = start(monitor);
  monitor.once('pong', function(){
    check_history(t, stop(), ['pong']);
    t.equal(response.isDone(), true);
  });
});


test('uri-monitor emits a \'connection\' event following the first ping response if it is a \'pong\'.', function(t){
  t.plan(2)
  var response = nock(uri).get('/').reply(200);
  var monitor = Monitor(uri);
  var stop = start(monitor);
  monitor.on('connection', function(){
    check_history(t, stop(), ['pong', 'connection']);
    t.equal(response.isDone(), true);
  });
});


test('uri-monitor emits a \'disconnection\' event following the first ping response if it is a \'drop\'.', function(t){
  t.plan(2)
  var response = nock(uri).get('/').reply(404);
  var monitor = Monitor(uri);
  var stop = start(monitor);
  monitor.on('disconnection', function(){
    check_history(t, stop(), ['drop', 'disconnection']);
    t.equal(response.isDone(), true);
  });
});


test('uri-monitor emits a \'connection\' event when a \'drop\' is followed by a \'pong\'.', function(t){
  t.plan(2)
  var response = nock(uri)
    .get('/').times(2).reply(404)
    .get('/').reply(200);
  var monitor = Monitor(uri, 1);
  var stop = start(monitor);
  monitor.on('connection', function(){
    t.equal(response.isDone(), true);
    check_history(t, stop(), ['drop', 'disconnection', 'drop', 'pong', 'connection']);
  });
});


test('uri-monitor emits a \'disconnection\' event when a \'pong\' is followed by a \'drop\'.', function(t){
  t.plan(2);
  var response = nock(uri)
    .get('/').times(2).reply(200)
    .get('/').reply(404);
  var monitor = Monitor(uri, 1);
  var stop = start(monitor);
  monitor.on('disconnection', function(){
    t.equal(response.isDone(), true);
    check_history(t, stop(), ['pong', 'connection', 'pong', 'drop', 'disconnection']);
  });
});


test('uri-monitor requests timeout after 2 seconds.', function(t){
  t.plan(2);
  var monitor = Monitor(uri, 10000, 100);

  // Crate a server that will never respond...
  var app = express();
  var server = http.createServer(app);
  app.get('/', function(){});

  server.listen(9333, function(){
    var stop = start(monitor);
    monitor.on('drop', function(err){
      t.equal(err.timeout, 100);
      check_history(t, stop(), ['drop']);
      server.close();
      server.unref();
    });
  });

});