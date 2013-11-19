
# uri-monitor [![Build Status](https://travis-ci.org/jasonkuhrt/uri-monitor.png)](https://travis-ci.org/jasonkuhrt/uri-monitor)
  Monitor a URI's connectivity


## Installation

Install with [component(1)](http://component.io):

    $ component install jasonkuhrt/uri-monitor

Install with [npm(1)](https://npmjs.org)

    $ npm install uri-monitor


## API
#### start()
#### stop()
#### ping(callback(err, response))
#### event 'drop'
#### event 'pong'
#### event 'connecton'
#### event 'disconnection'


## Notes
  Following the first `ping()` a `connection` event is emitted if said `ping()` got `pong`, or a `disconnection` event is emitted if said `ping()` got `drop`.

  Enable debug mode with label `uri_monitor` using [debug](https://github.com/visionmedia/debug)


## License

  BSD-2-Clause