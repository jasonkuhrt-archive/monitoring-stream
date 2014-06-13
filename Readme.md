# uri-monitor [![Build Status](https://travis-ci.org/jasonkuhrt/uri-monitor.png)](https://travis-ci.org/jasonkuhrt/uri-monitor) [![Dependency Status](https://gemnasium.com/jasonkuhrt/uri-monitor.png)](https://gemnasium.com/jasonkuhrt/uri-monitor) <a href="http://badge.fury.io/js/uri-monitor"><img src="https://badge.fury.io/js/uri-monitor@2x.png" alt="NPM version" height="18"></a>
  Monitor a URI's connectivity


## Installation

Install with [component(1)](http://component.io) for client:

    $ component install jasonkuhrt/uri-monitor

Install with [npm(1)](https://npmjs.org) for server:

    $ npm install uri-monitor


## API

### Constructor

    URI_Monitor :: String URI, Int check_interval_ms -> uri_monitor

- `uri` The URI to monitor. Plain GET requests willbe made against this.
- `interval_ms` The time between checks

`uri_monitor` is an instance of [EventEmitter2](https://github.com/asyncly/EventEmitter2).


### Methods

##### .start()
    start :: -> uri_monitor

    Begin the monitor; Boots a setInterval.

##### .stop()
    stop :: -> uri_monitor

Stop the monitor:
  - kills the current setInterval
  - Aborts the current request via [`superagent.abort()`](http://visionmedia.github.io/superagent/#aborting-requests).

##### .check()
    check :: -> uri_monitor
Force a manual check. This is a totally independent check. It does not affect the start/stop system in any way. It does not affect the setInterval being run.

##### .on()
    on :: String event_name, (* -> void) -> uri_monitor

Listen for events.

event name | callback arguments | description
-----------|--------------------|-----------------------------------
`'check'`  | `is_connected :: Boolean`, `response :: Check_Result` | A check result
`'change'` | `is_connected :: Boolean`, `response :: Check_Result` | A check result, and it is different than the last check
`'pong'`            | `response :: Check_Result` | A check result that is a success
`'drop'`            | `response :: Check_Result` | A check result that is a failure
`'connection'`      | `response :: Check_Result` | A check result that is a success, and it is different than the last check
`'disconnection'`   | `response :: Check_Result` | A check result that is a failure, and it is different than the last check

## Types

##### `Check_Result`

`superagent` has two types of request errors: general IO and response errors in the 400 or 500 range. URI Monitor treats both as a check failure. Result can be one of three things:

1. If a successful request then the `superagent` [`response`](http://visionmedia.github.io/superagent/#response-properties) object.
2. If a failed request due to IO, then the [`err`](http://visionmedia.github.io/superagent/#error-handling) as returned by `superagent`.
3. If a failed request due to 4xx/5xx range response, then the [`response.error`](http://visionmedia.github.io/superagent/#error-handling) as provided by `superagent`.

## Notes

  - Enable debug mode with label `uri-monitor` using [debug](https://github.com/visionmedia/debug)