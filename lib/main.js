import FRP from "most"
import request from "superagent-bluebird-promise"
import Defer from "./defer"



/* Event Constructor */

//    Event :: String -> Object -> Event
const Event = (type) => (data) => ({ type, data })



/* Event Data */

const eventNames = {
  check: "checked",
  change: "changed",
}
const CheckEvent = Event(eventNames.check)
const ChangeEvent = Event(eventNames.change)



//    ping :: PingSettings -> Promise PingResultEvent
const ping = (config) => (
  request(config.uri)
  .timeout(config.timeout)
  .then((response) => (
    Event("response")({
      isResponsive: true,
      result: response
    })
  ))
  .catch((error) => (
    Event("response")({
      isResponsive: false,
      result: error
    })
  ))
)



//    create :: String, Maybe Integer -> UriMonitor
const create = (uri, checkIntervalMs = 1000) => {
  const stream = FRP.create((add) => {

    const state = {
      wasResponsive: null,
      willEnd: Defer.create(),
    }

    const onPingResult = ({ data }) => {
      add(CheckEvent(data))
      if (state.wasResponsive !== data.isResponsive) {
        add(ChangeEvent(data))
        state.wasResponsive = data.isResponsive
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

  /* UX: Expose filtered streams for simplifying access to common
  patterns. */

  stream.downs = stream.filter(({ type, data }) => (
    type === eventNames.change && !data.isResponsive
  ))
  stream.ups = stream.filter(({ type, data }) => (
    type === eventNames.change && data.isResponsive
  ))
  stream.drops = stream.filter(({ type, data }) => (
    type === eventNames.check && !data.isResponsive
  ))
  stream.pongs = stream.filter(({ type, data }) => (
    type === eventNames.check && data.isResponsive
  ))

  return stream
}



export default {
  create,
  eventNames,
}
export {
  create,
  eventNames,
}
