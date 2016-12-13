# coffeelint: disable=max_line_length

{ change, check, responsive, unresponsive, pong, drop } = Monitor.eventNames

uri = 'http://localhost:9333'

Server = (times = 1) ->
  nock(uri).get('/').times(times).reply(200)

ServerError =
  create: (times = 1) ->
    nock(uri).get('/').times(times).reply(500, ServerError.returnData)
  returnData:
    message: "Exceeded capacity!"

monitor = Monitor.create(uri, 200)






describe 'uri-monitor', ->
  @slow 1000

  describe '.observe()', ->

    it 'starts the monitor, issuing HTTP GET requests against a given URI.', ->
      server = Server()

      monitor
        .take 1
        .map ({ data: { isResponsive }}) -> isResponsive
        .observe a.eq true
        .then server.done.bind(server)



  describe 'the first check result causes four events', ->

    it 'can be check / change, where change is pong', ->
      server = Server()
      events = [check, change]

      monitor
        .take events.length
        .observe ({ type }) -> a.eq events.shift(), type
        .then server.done.bind(server)


    it 'can be check / change, where change is drop', ->
      events = [check, change]

      monitor
        .take events.length
        .observe ({ type }) -> a.eq events.shift(), type



  describe 'the nth check result', ->

    it 'can be check, without change, in pong state', ->
      server = Server(2)
      events = [check]

      monitor
        .skip 2
        .take events.length
        .observe ({ type }) -> a.eq events.shift(), type
        .then server.done.bind(server)

    it 'can be check, without change, in drop state ', ->
      events = [check]

      monitor
        .skip 2
        .take events.length
        .observe ({ type }) -> a.eq events.shift(), type

    it 'can be check / change, where change is drop', ->
      server = Server(1)
      events = [check, change]

      monitor
        .skip 2
        .take events.length
        .observe ({ type }) -> a.eq events.shift(), type
        .then server.done.bind(server)

    it 'can be check / change, where change is pong', ->
      events = [check, change]
      server = undefined

      P.delay(1).then -> server = Server()

      monitor
        .skip 2
        .take events.length
        .observe ({ type }) -> a.eq events.shift(), type
        .then -> server.done()



  describe 'sugar', ->

    it '.drops filters for checks that drop', ->
      events = [check, check, check]

      monitor
      .drops
      .take events.length
      .observe ({ type, data: { isResponsive } }) ->
        a.eq events.shift(), type
        a not isResponsive, 'is drop'

    it '.pongs filters for checks that pong', ->
      server = Server(3)
      events = [check, check, check]

      monitor
      .pongs
      .take events.length
      .observe ({ type, data: { isResponsive } }) ->
        a.eq events.shift(), type
        a isResponsive, 'is pong'
      .then server.done.bind(server)

    it '.downs filters for changes into responsive state', ->
      server = Server(1)
      events = [change]

      monitor
      .downs
      .take events.length
      .observe ({ type, data: { isResponsive } }) ->
        a.eq events.shift(), type
        a not isResponsive, 'is unresponsive state'
      .then server.done.bind(server)

    it '.ups filters for changes into responsive state', ->
      events = [change]
      server = undefined
      P.delay(300).then -> server = Server(1)

      monitor
      .ups
      .take events.length
      .observe ({ type, data: { isResponsive } }) ->
        a.eq events.shift(), type
        a isResponsive, 'is responsive state'
      .then -> server.done()



describe 'request failures', ->

  it 'on 500 response .result is an error with .response', ->
    server = ServerError.create()

    monitor
    .take 1
    .observe ({ data: { result }}) ->
      a.instanceOf result, Error
      a.isObject result.response
      a.isNumber result.response.status
      a.eq serverError.returnData, result.response.data
    .then server.done.bind(server)


  it 'on ENOTFOUND .result is an error at the network level', ->

    Monitor
    .create('http://92hgd76120wm10.com', 200)
    .take 1
    .observe ({ data: { result }}) ->
      a.instanceOf result, Error
      a.eq 'ENOTFOUND', result.code,
      a.eq undefined, result.response
