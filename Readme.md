# uri-monitor [![Build Status](https://travis-ci.org/jasonkuhrt/uri-monitor.png)](https://travis-ci.org/jasonkuhrt/uri-monitor) [![Dependency Status](https://gemnasium.com/jasonkuhrt/uri-monitor.png)](https://gemnasium.com/jasonkuhrt/uri-monitor) [![NPM version](https://badge.fury.io/js/uri-monitor.png)](http://badge.fury.io/js/uri-monitor)
  Monitor a URI's connectivity


## Installation

Install with [component(1)](http://component.io):

    $ component install jasonkuhrt/uri-monitor

Install with [npm(1)](https://npmjs.org)

    $ npm install uri-monitor


## API
### Constructor
    URI_Monitor :: String uri, Int interval_ms -> uri_monitor

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
