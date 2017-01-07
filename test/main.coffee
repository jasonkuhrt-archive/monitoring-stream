# coffeelint: disable=max_line_length

{ change, check, responsive, unresponsive, pong, drop } = Monitor.eventNames

uri = 'http://localhost:9333'

Server = (times = 1) ->
  nock(uri).get('/').times(times).reply(200)

ServerError =
  returnData:
    message: "Exceeded capacity!"
  create: (times = 1) ->
    nock(uri)
    .get('/')
    .times(times)
    .reply(500, ServerError.returnData)

monitor = Monitor.create(uri, 200)

accumulate = (acc, x) -> acc.concat([x])





describe 'uri-monitor', ->
  @slow 1000

  describe '.observe()', ->

    it 'starts the monitor, issuing HTTP GET requests against a given URI.', ->
      server = Server()

      monitor
        .take 1
        .map F.path(['data', 'isResponsive'])
        .observe a.eq true
        .then server.done.bind(server)



  describe 'the first check result causes four events', ->

    it 'init -> up', ->
      server = Server 1

      Monitor
      .create uri, 200
      .takeUntil FRP.fromPromise(P.delay(200 - (200 / 2)))
      .map F.path(["type"])
      .reduce accumulate, []
      .then a.eq ["check", "pong", "change", "up"]
      .then server.done.bind(server)


    it 'init -> down', ->
      Monitor
      .create uri, 200
      .takeUntil FRP.fromPromise(P.delay(200 - (200 / 2)))
      .map F.path(["type"])
      .reduce accumulate, []
      .then a.eq ["check", "drop", "change", "down"]



  describe 'the nth check result', ->

    it 'up -> up', ->
      server = Server 2

      Monitor
      .create uri, 200
      .takeUntil FRP.fromPromise(P.delay(400 - (200 / 2)))
      .map F.path(["type"])
      .skip 4
      .reduce accumulate, []
      .then a.eq ["check", "pong"]
      .then server.done.bind(server)

    it 'down -> down', ->
      Monitor
      .create uri, 200
      .takeUntil FRP.fromPromise(P.delay(400 - (200 / 2)))
      .map F.path(["type"])
      .skip 4
      .reduce accumulate, []
      .then a.eq ["check", "drop"]

    it 'up -> down', ->
      server = Server 1

      Monitor
      .create uri, 200
      .takeUntil FRP.fromPromise(P.delay(400 - (200 / 2)))
      .map F.path(["type"])
      .skip 4
      .reduce accumulate, []
      .then a.eq ["check", "drop", "change", "down"]
      .then server.done.bind(server)

    it 'down -> up', ->
      P.delay(1).then -> Server()

      Monitor
      .create uri, 200
      .takeUntil FRP.fromPromise(P.delay(400 - (200 / 2)))
      .map F.path(["type"])
      .skip 4
      .reduce accumulate, []
      .then a.eq ["check", "pong", "change", "up"]

  describe 'sugar', ->

    it '.drops has drop events', ->
      Monitor
      .create uri, 200
      .drops
      .takeUntil FRP.fromPromise(P.delay(400 - (200 / 2)))
      .map F.path(["type"])
      .reduce accumulate, []
      .then a.eq ["drop", "drop"]

    it '.pongs has pong events', ->
      server = Server 3

      Monitor
      .create uri, 200
      .pongs
      .takeUntil FRP.fromPromise(P.delay(600 - (200 / 2)))
      .map F.path(["type"])
      .reduce accumulate, []
      .then a.eq ["pong", "pong", "pong"]

    it '.downs has down events', ->
      P.delay(1).then(() -> Server 1)

      Monitor
      .create uri, 200
      .downs
      .takeUntil FRP.fromPromise(P.delay(600 - (200 / 2)))
      .map F.path(["type"])
      .reduce accumulate, []
      .then a.eq ["down", "down"]

    it '.ups has up events', ->
      Server 1
      P.delay(400).then(() -> Server 1)

      Monitor
      .create uri, 200
      .ups
      .takeUntil FRP.fromPromise(P.delay(600 - (200 / 2)))
      .map F.path(["type"])
      .reduce accumulate, []
      .then a.eq ["up", "up"]

describe 'request failures', ->

  it 'on 500 response .result is an error with .response', ->
    server = ServerError.create()

    monitor
    .take 1
    .observe ({ data: { result }}) ->
      a.instanceOf result, Error
      a.isObject result.response
      a.isNumber result.response.status
      a.eq ServerError.returnData, result.response.data
    .then server.done.bind(server)


  it 'on ENOTFOUND .result is an error at the network level', ->

    Monitor
    .create('http://92hgd76120wm10.com', 200)
    .take 1
    .observe ({ data: { result }}) ->
      a.instanceOf result, Error
      a.eq 'ENOTFOUND', result.code,
      a.eq undefined, result.response
