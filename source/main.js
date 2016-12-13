import * as FRP from "most"
import { create as createStream } from "@most/create"
import HTTPClient, { CancelToken } from "axios"


/* Event Constructor */

//    Event :: String -> Object -> Event
const Event = (type) => (
  (data) => (
    ({ type, data })
  )
)



/* Event Data */

const eventNames = {
  check: "checked",
  change: "changed",
}
const CheckEvent = Event(eventNames.check)
const ChangeEvent = Event(eventNames.change)



//    ping :: PingSettings -> Promise PingResultEvent
const ping = (config) => (
  HTTPClient(config)
  .then((result) => ({
    isResponsive: true,
    result
  }))
  .catch((error) => ({
    isResponsive: false,
    result: error
  }))
)



//    create :: String, Maybe Integer -> UriMonitor
const create = (uri, checkIntervalMs = 1000) => {
  const stream = createStream((add) => {

    const state = {
      wasResponsive: null,
      cancelToken: CancelToken.source(),
    }

    const doPing = () => {
      ping({
        url: uri,
        cancelToken: state.cancelToken.token,
        timeout: checkIntervalMs,
      })
      .then((result) => {
        add(CheckEvent(result))
        if (state.wasResponsive !== result.isResponsive) {
          add(ChangeEvent(result))
          state.wasResponsive = result.isResponsive
        }
      })
    }

    FRP
    .periodic(checkIntervalMs, 0)
    .until(FRP.fromPromise(state.cancelToken.token.promise))
    .observe(doPing)

    return function dispose () {
      state.cancelToken.cancel("Monitor stopped by user.")
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
