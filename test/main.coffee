# coffeelint: disable=max_line_length

{ change, check, responsive, unresponsive, pong, drop } = Monitor.eventNames
uri = 'http://localhost:9333'
isChange = F.propEq 'type', change
isCheck = F.propEq 'type', check
getIsResponsive = F.path(['data', 'isResponsive'])
Server = (times = 1) ->
  nock(uri).get('/').times(times).reply(200)






describe 'uri-monitor', ->
  @slow 1000

  before ->
    @monitor = Monitor.create(uri, 200)



  describe '.observe()', ->

    it 'starts the monitor, issuing HTTP GET requests against a given URI.', ->
      server = Server()

      @monitor
        .take 1
        .map getIsResponsive
        .observe a.eq true
        .then server.done



  describe 'the first check result causes four events', ->

    it 'can be check / change, where change is pong', ->
      server = Server()
      events = [check, change]

      @monitor
        .take events.length
        .observe (event) -> a.eq events.shift(), event.type
        .then server.done


    it 'can be check / change, where change is drop', ->
      events = [check, change]

      @monitor
        .take events.length
        .observe (event) -> a.eq events.shift(), event.type



  describe 'the nth check result', ->

    it 'can be check, without change, in pong state', ->
      server = Server(2)
      events = [check]

      @monitor
        .skip 2
        .take events.length
        .observe (event) -> a.eq events.shift(), event.type
        .then server.done

    it 'can be check, without change, in drop state ', ->
      events = [check]

      @monitor
        .skip 2
        .take events.length
        .observe (event) -> a.eq events.shift(), event.type

    it 'can be check / change, where change is drop', ->
      server = Server(1)
      events = [check, change]

      @monitor
        .skip 2
        .take events.length
        .observe (event) -> a.eq events.shift(), event.type
        .then server.done

    it 'can be check / change, where change is pong', ->
      events = [check, change]

      P.delay(1).then => @server = Server()

      @monitor
        .skip 2
        .take events.length
        .observe (event) -> a.eq events.shift(), event.type
        .then => @server.done()
