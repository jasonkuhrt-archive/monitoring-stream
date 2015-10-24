import EventEmitter3 from 'eventemitter3'
import request from 'superagent'
import Log from 'debug'



const log = Log('uri-monitor')

const freshState = () => ({
  is_on: false,
  was_connected: null,
  current_request: null,
  current_interval_timer: null
})

const httpCheck = (uri, timeoutMs, cb) => (
  request(uri)
    .timeout(timeoutMs)
    .end((err, res) => {
      const anyError = err || res.error
      const isConnected = (anyError ? false : true)
      const errOrRes = anyError || res
      cb(isConnected, errOrRes)
    })
)



//
// type Uri = String
// type Milliseconds = Integer
//
//    create :: Uri, Milliseconds -> UriMonitor
const create = (uri, checkIntervalMs = 1000) => {

  const api = new EventEmitter3()

  api.state = freshState()

  api.start = () => {
    if (api.state.is_on) return
    log('start')

    api.state.is_on = true
    api.check()
    api.state.current_interval_timer = setInterval(api.check, checkIntervalMs)
    return api
  }

  api.stop = () => {
    if (!api.state.is_on) return
    log('stop')

    api.state = clearState(api.state)
    return api
  }

  api.check = () => {
    log('check', uri)

    api.state.current_request = httpCheck(uri, checkIntervalMs, updateCheckedResult)
    return api
  }


  // Private

  function clearState (oldState) {
    // If api.check is being used manually outside
    // api.start then we do not have an interval_timer
    // to clean up.
    if (oldState.current_interval_timer) {
      clearInterval(oldState.current_interval_timer)
    }
    //console.log(oldState.current_request)
    oldState.current_request.abort()
    return freshState()
  }

  function updateCheckedResult (isConnected, errOrRes) {
    api.emit('check', isConnected, errOrRes)
    api.emit((isConnected ? 'pong' : 'drop'), errOrRes)

    if (isConnected !== api.state.was_connected) {
      api.emit('change', isConnected, errOrRes)
      api.emit((isConnected ? 'connection' : 'disconnection'), errOrRes)
    }

    api.state.was_connected = isConnected
  }


  return api
}



export {
  create as default
}
