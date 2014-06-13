var EventEmitter2 = require('eventemitter2').EventEmitter2;
var request = require('superagent');
var log = require('debug')('uri-monitor');



module.exports = create_uri_monitor;

// create_uri_monitor :: String, Int, Int -> URI_Monitor
//
// @param uri <String>
// @param check_interval_ms <Int> ?(1000)
//
function create_uri_monitor(uri, check_interval_ms){
  check_interval_ms = check_interval_ms || 1000;

  var api = new EventEmitter2();

  api.state = fresh_state();

  api.start = function(){
    if (api.state.is_on) return;
    log('start');

    api.state.is_on = true;
    api.check();
    api.state.current_interval_timer = setInterval(api.check, check_interval_ms);
    return api;
  };

  api.stop = function(){
    if (!api.state.is_on) return;
    log('stop');

    api.state = clear_state(api.state);
    return api;
  };

  api.check = function(){
    log('check', uri);

    api.state.current_request = http_check(uri, check_interval_ms, update_checked_result);
    return api;
  };


  // Private

  function clear_state(old_state){
    // If api.check is being used manually outside
    // api.start then we do not have an interval_timer
    // to clean up.
    if (old_state.current_interval_timer) {
      clearInterval(old_state.current_interval_timer);
    }
    //console.log(old_state.current_request);
    old_state.current_request.abort();
    return fresh_state();
  }

  function update_checked_result(is_connected, err_or_res){
    api.emit('check', is_connected, err_or_res);
    api.emit((is_connected ? 'pong' : 'drop' ), err_or_res);

    if (is_connected !== api.state.was_connected) {
      api.emit('change', is_connected, err_or_res);
      api.emit((is_connected ? 'connection' : 'disconnection' ), err_or_res);
    }

    api.state.was_connected = is_connected;
  }


  return api;
}






// Private

function fresh_state(){
  return {
    is_on: false,
    was_connected: null,
    current_request: null,
    current_interval_timer: null
  };
}

function http_check(uri, timeout_ms, cb){
  function handle_response(err, res){
    var any_error = err || res.error;
    var is_connected = (any_error ? false : true);
    var err_or_res = any_error || res;
    cb(is_connected, err_or_res);
  }

  return request(uri).timeout(timeout_ms).end(handle_response);
}