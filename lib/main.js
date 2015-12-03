import FRP from 'most'
import request from 'superagent-bluebird-promise'
import Defer from './defer'



/* Event Constructor */

//    Event :: String -> Object -> Event
const Event = (type) => (data) => ({ type, data })



/* Event Data */

const eventNames = {
  check: 'checked',
  change: 'changed',
}
const CheckEvent = Event(eventNames.check)
const ChangeEvent = Event(eventNames.change)



//    ping :: PingSettings -> Promise PingResultEvent
const ping = (config) => (
  request(config.uri)
  .timeout(config.timeout)
  .then((response) => (
    Event('response')({
      isResponsive: true,
      result: response
    })
  ))
  .catch((error) => (
    Event('response')({
      isResponsive: false,
      result: error
    })
  ))
)



//    create :: String, Maybe Integer -> UriMonitor
const create = (uri, checkIntervalMs = 1000) => (
  FRP.create((add) => {

    const state = {
      wasResponsive: null,
      willEnd: Defer.create(),
    }

    const onPingResult = ({ data }) => {
      add(CheckEvent(data))
      if (state.wasResponsive !== data.isResponsive) {
        add(ChangeEvent(data))
        Object.assign(state, {
          wasResponsive: data.isResponsive
        })
      }
    }

    const doPing = () => {
      state.pinging = ping({ uri, timeout: checkIntervalMs })
      state.pinging.then(onPingResult)
    }

    FRP
    .periodic(checkIntervalMs, 0)
    .until(FRP.fromPromise(state.willEnd.promise))
    .observe(doPing)

    return function dispose () {
      state.willEnd.resolve()
      if (state.pinging.isPending()) {
        state.pinging.cancel()
      }
    }
  })
)



export default {
  create,
  eventNames,
}
export {
  create,
  eventNames,
}
