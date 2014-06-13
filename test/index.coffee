


uri = 'http://localhost:9333'

describe 'uri-monitor', ->
  @timeout 5000
  @slow 5000
  monitor = server = undefined

  beforeEach ->
    server = nock(uri).get('/').reply(200)
    monitor = Monitor(uri, 200)

  afterEach ->
    monitor.stop()
    server.done()
    nock.cleanAll()



  describe '.start()', ->

    it 'begins the monitor', (done) ->
      monitor.start().once 'check', -> done()

  describe '.check()', ->

    it 'issues HTTP GET requests against a given uri.', (done) ->
      monitor.start().once 'check', (is_connected)->
        a is_connected
        done()



  describe '.stop()', ->

    it 'immediately prevents any further events', (done) ->
      did_events = 0

      # Should only trigger once
      monitor.start().on 'check', (is_connected)->
        did_events++

      setTimeout monitor.stop, 50

      setTimeout (->
        a.equal did_events, 1, 'no events fired after stop()'
        done()
      ), 1000



  describe 'on first check result', ->

    it 'emits both "check" and "change"', (done)->
      events = 0
      monitor.start()
      try_done = (is_connected)->
        a is_connected
        events += 1
        if events is 2
          done()
      monitor.once 'check', try_done
      monitor.once 'change', try_done

    it 'is_connected === true, if response within interval_ms', (done) ->
      # clear/consume the initial mock server. It would
      # be nice if nock let us cancel a mock but alas it does not.
      monitor.start().once 'change', (is_connected)->
        # Now there are no pending mocks
        monitor_ = Monitor(uri, 200).start().once 'change', (is_connected)->
          a !is_connected
          monitor_.stop()
          done()

    it 'is_connected === true, if response within interval_ms', (done) ->
      monitor.start().once 'change', (is_connected)->
        a is_connected, 'connected'
        done()



  describe 'on n check result', ->

    it 'is_connected === false if no server response within interval_ms', (done) ->
      i = 0
      exps = [true, true, false]
      monitor.start().on 'check', (is_connected)->
        a.equal is_connected, exps[i]
        if i is 0
          server = nock(uri).get('/').reply(200)
        if i is 2
          done()
        i++


    it 'is_connected === true if no server response within interval_ms', (done) ->
      nock.cleanAll()
      i = 0
      exps = [false, false, true]
      monitor.start().on 'check', (is_connected)->
        a.equal is_connected, exps[i]
        if i is 1
          server = nock(uri).get('/').reply(200)
        if i is 2
          done()
        i++