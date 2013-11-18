var EventEmitter2 = require('EventEmitter2').EventEmitter2;
var _ = require('lodash');
var request = require('superagent');
var log = require('debug')('uri_monitor');
var Maybe = require('maybe');
var state = require('./lib/state');
var maybef = require('maybef');

// Helpers

function tap_compose(){
  // instead of partial_right can we use curry1?
  return compose.apply(null, map(arguments, function(f){ return partial_right(tap, f); } ));
}

var all = _.all;
var partial = _.partial;
var partial_right = _.partialRight;
var map = _.map;
var first = _.first;
var tap = _.tap;
var compose = _.compose;
var to_array = _.toArray;
var curry = _.curry;
var not = function(a){ return !a; }






// @param uri <String>
// @param interval_ms <Int> ?(1000)

module.exports = function create_uri_monitor(uri, interval_ms){
  // TODO arg assertions

  interval_ms = interval_ms || 1000;



  var api = new EventEmitter2();
  var handle_ping_response = state(1, do_handle_ping_response);

  api.start = function(){
    if (_is_monitoring) return;
    _is_monitoring = true;
    log('start');
    var loop = function(){
      if (_is_monitoring) {
        _next_ping_timeout = setTimeout(do_ping, interval_ms);
      }
    };
    var do_ping = partial(api.ping, loop);
    do_ping();
  };

  api.stop = function(){
    if (not(_is_monitoring)) return;
    log('stop');
    _is_monitoring = false;
    clearTimeout(_next_ping_timeout);
    if (_current_request) _current_request.abort();
  };

  api.ping = function(callback){
    log('pinging', uri);
    var handle_response = function(err, res){
      handle_ping_response(err || res.error ? false : true);
      maybef(callback)(err, res)
    };

    _current_request = request(uri).end(handle_response);
  };





  // Private

  var _is_monitoring;
  var _current_request;
  var _next_ping_timeout;

  function do_handle_ping_response(is_pong, pong_history){
    var maybe_connection_change = curry(function(is_pong, was_pong){
      return Maybe(all([is_pong, not(was_pong)]) ? true  :
                   all([not(is_pong), was_pong]) ? false :
                   null);
    });

    function io_handle_response(is_pong){
      tap_compose(api.emit.bind(api), partial(log, 'ping got'))(is_pong ? 'pong' : 'drop');
    }

    function io_handle_connection_change(to_connection){
      tap_compose(api.emit.bind(api), partial(log, 'state change'))(to_connection ? 'connection' : 'disconnection');
    }

    // Emit response type
    io_handle_response(is_pong);

    // Emit connection-change type, if applicable
    Maybe(first(pong_history))
      .maybe(not(is_pong), maybe_connection_change(is_pong))
      .bind(io_handle_connection_change);
  }

  return api;
};