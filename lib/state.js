var lodash = require('lodash');
var clone = lodash.clone;
var size = lodash.size;



module.exports = state;

function state(max_history_size){
  var history = [];
  return function(value, handler_f){
    handler_f(value, clone(history));
    history.unshift(value);
    if (size(history) > max_history_size) {
      history.pop();
    }
  };
}