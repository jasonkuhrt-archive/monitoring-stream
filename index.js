var EventEmitter2 = require('eventemitter2').EventEmitter2;
var request = require('superagent');
var log = require('debug')('uri_monitor');
var Maybe = require('maybe');
var lo = require('lodash'),
    all = lo.all,
    partial = lo.partial,
    partial_right = lo.partialRight,
    first = lo.first,
    compose = lo.compose,
    to_array = lo.toArray,
    curry = lo.curry,
    not = function(a){ return !a; };
var State = require('./lib/state');





// @param uri <String>
// @param opt_interval_ms <Int> ?(1000)

module.exports = create_uri_monitor;

function create_uri_monitor(uri, opt_interval_ms, opt_timeout_ms){
  opt_interval_ms = opt_interval_ms || 1000;
  opt_timeout_ms = opt_timeout_ms || 4000;


  var api = new EventEmitter2();
  var emit = function(){
    log.apply(null, ['Event:'].concat(to_array(arguments)));
    api.emit.apply(api, arguments);
  };
  var state = State(1);

  api.start = function(){
    if (_is_monitoring) return;
    _is_monitoring = true;
    log('start');
    var loop = function(){
      if (_is_monitoring) {
        _next_ping_timeout = setTimeout(do_ping, opt_interval_ms);
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
    if (_current_request) {
      _current_request.abort();
    }
  };

  api.ping = function(callback){
    log('pinging', uri);
    var handle_response = function(err, res){
      var any_error = err || res.error;
      state((any_error ? false : true), function(is_pong, pong_history){
        do_handle_ping_response(is_pong, first(pong_history), any_error || res);
      });
      if (lo.isFunction(callback)) callback(err, res) ;
    };

    _current_request = request(uri).timeout(opt_timeout_ms).end(handle_response);
  };


  // Private

  var _is_monitoring;
  var _current_request;
  var _next_ping_timeout;

  function do_handle_ping_response(is_pong, previous_result, err_or_res){
    var io_handle_response = compose(partial_right(emit, err_or_res), ping_result_to_event_name);
    var io_handle_connection_change = compose(emit, connection_change_to_event_name);

    // Emit response type
    io_handle_response(is_pong);

    // Emit connection-change type, if applicable
    Maybe(previous_result)
      .maybe(not(is_pong), maybe_connection_change(is_pong))
      .bind(io_handle_connection_change);
  }

  return api;
}






// Private

var maybe_connection_change = curry(function(is_pong, was_pong){
  return Maybe(all([is_pong, not(was_pong)]) ? true  :
               all([not(is_pong), was_pong]) ? false :
               null);
});



function ping_result_to_event_name(is_pong){
  return is_pong ? 'pong' : 'drop';
}



function connection_change_to_event_name(to_connection){
  return to_connection ? 'connection' : 'disconnection';
}