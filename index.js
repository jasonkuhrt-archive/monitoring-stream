var EventEmitter2 = require('EventEmitter2').EventEmitter2;
var _ = require('lodash');
var request = require('superagent');
var log = require('debug')('uri_monitor');



// @param uri <String>
// @param interval_ms <Int> ?(1000)

module.exports = function create_uri_monitor(uri, interval_ms){
  // TODO arg assertions

  interval_ms = interval_ms || 1000;



  var api = new EventEmitter2();
  var handle_ping_response = make_tracker(1, do_handle_ping_response);

  api.start = function(){
    log('start');
    var loop = function(){
      is_monitoring = setTimeout(do_ping, interval_ms);
    };
    var do_ping = _.partial(api.ping, loop);
    do_ping();
  };

  api.stop = function(){
    log('stop');
    clearTimeout(is_monitoring);
    reboot();
  };

  api.ping = function(callback){
    log('pinging', uri);
    var handle_response = function(err, res){
      var any_error = err || res.error;
      handle_ping_response(any_error ? false : true);
      if (_.isFunction(callback)) {
        callback(err, res);
      }
    };

    request(uri).end(handle_response);
  };





  // Private

  var is_monitoring;

  function do_handle_ping_response(response, history){
    var response_type = response ? 'pong' : 'drop' ;
    log('ping got ' + response_type);
    var response_prev = _.first(history);

    // Emit an event for cases where the response_type differs from previous.

    if (_.isUndefined(response_prev)){
      // Always emit on the response of the first ping
      api.emit({true:'connection', false:'disconnection'}[response]);
    } else if (!response_prev && response) {
      api.emit('connection');
    } else if (response_prev && !response) {
      api.emit('disconnection');
    }

  }

  return api;
};


// Helpers

function tern(condition_f, true_f, false_f){
  condition_f() ? true_f() : false_f() ;
}

function make_tracker(max_history_size, handler_f){
  var history = [];
  return function(value){
    handler_f(value, _.clone(history));
    history.unshift(value);
    if (_.size(history) > max_history_size) {
      history.pop();
    }
  }
}