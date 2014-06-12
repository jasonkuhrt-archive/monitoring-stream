# uri-monitor [![Build Status](https://travis-ci.org/jasonkuhrt/uri-monitor.png)](https://travis-ci.org/jasonkuhrt/uri-monitor) [![Dependency Status](https://gemnasium.com/jasonkuhrt/uri-monitor.png)](https://gemnasium.com/jasonkuhrt/uri-monitor) <a href="http://badge.fury.io/js/uri-monitor"><img src="https://badge.fury.io/js/uri-monitor@2x.png" alt="NPM version" height="18"></a>
  Monitor a URI's connectivity


## Installation

Install with [component(1)](http://component.io):

    $ component install jasonkuhrt/uri-monitor

Install with [npm(1)](https://npmjs.org)

    $ npm install uri-monitor


## API
### Constructor
    URI_Monitor :: String uri, Int interval_ms, Int timeout_ms -> uri_monitor

    uri: The URI to monitor
    interval_ms: The time between pings
    timeout_ms: How long ping waits for a response before declaring it timedout


### Instance Methods
##### start
    start :: -> undefined

##### stop
    stop :: -> undefined

### Instance Events
##### drop
    'drop', Error

##### pong
    'pong', Response

##### connection
    'connecton'

##### disconnection
    'disconnection'



## Notes
  Following the first `ping()` a `connection` event is emitted if said `ping()` got `pong`, or a `disconnection` event is emitted if said `ping()` got `drop`.

  Enable debug mode with label `uri_monitor` using [debug](https://github.com/visionmedia/debug)


## License

  BSD-2-Clause
