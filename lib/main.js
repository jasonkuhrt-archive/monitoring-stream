import FRP from 'most'
import request from 'superagent-bluebird-promise'
import Defer from './defer'



const eventNames = {
  pong: 'ponged',
  drop: 'dropped',
  check: 'checked',
  change: 'changed',
  responsive: 'responsive',
  unresponsive: 'unresponsive',
}

const State = () => ({
  wasResponsive: null,
  willEnd: Defer.create(),
})

const Event = (type) => (data) => ({
  type,
  data
})

const CheckEvent = Event(eventNames.check)

const ChangeEvent = Event(eventNames.change)

const PingResultEvent = Event('response')

const ping = (config) => (
  request(config.uri)
  .timeout(config.timeout)
  .then((response) => (
    PingResultEvent({
      isResponsive: true,
      result: response
    })
  ))
  .catch((error) => (
    PingResultEvent({
      isResponsive: false,
      result: error
    })
  ))
)



// type Uri          = String
// type Milliseconds = Integer
//
//    create :: Uri, Milliseconds -> UriMonitor
const create = (uri, checkIntervalMs = 1000) => (

  FRP.create((add) => {

    const state = State()

    const onPingResult = ({ data: { isResponsive, result }}) => {
      add(CheckEvent({ isResponsive, result }))
      add(Event((isResponsive ? eventNames.pong : eventNames.drop))({ result }))
      if (state.wasResponsive !== isResponsive) {
        state.wasResponsive = isResponsive
        add(ChangeEvent({ isResponsive, result }))
        add(Event(isResponsive ? eventNames.responsive : eventNames.unresponsive)({ result }))
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
