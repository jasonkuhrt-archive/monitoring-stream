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

  api.start = function(){
    var do_ping = function(){
      listener_count() ? api.ping(loop) : api.stop() ;
    };
    var loop = function(){
      is_monitoring = setTimeout(do_ping, interval_ms);
    };
    loop();
    log('start');
    return this;
  };

  api.stop = function(){
    clearTimeout(is_monitoring);
    reboot();
    log('stop');
    return this;
  };

  api.ping = function(callback){
    var options = {};
    var handle_response = function(err, res){
      var any_error = err || res.error;
      if (any_error) {
        log('ping got error:', String(any_error));
        api.emit('drop');
      } else {
        log('ping got reply:', res);
        api.emit('pong');
      }
      if (typeof callback === 'function') { callback(err, res); }
    };
    request(uri).end(handle_response);
    log('pinging', uri);
  };



  // private

  var is_monitoring;

  var listener_count = function(){
    return _.compose(_.size, _.flatten, _.map)(['pong', 'drop'], _.bind(api.listeners, api));
  };

  var reboot = function(){
    api.once('newListener', function(a){
      api.start();
    });
  };



  // kick-off

  reboot();
  return api;
};