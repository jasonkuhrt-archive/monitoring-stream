import * as FRP from "most"
import { ping } from "./Ping"


const eventTypeUpdater = (type) => (event) => (
  Object.assign({}, event, {
    type,
  })
)

const eventNames = {
  check: "check",
  drop: "drop",
  pong: "pong",
  change: "change",
  down: "down",
  up: "up",
}


const CheckEvent = (data) => ({
  type: eventNames.check,
  data,
})

const create = (uri, checkIntervalMs = 1000) => {
  const doPing = () =>
    ping({
      url: uri,
      timeout: checkIntervalMs,
    }).then(CheckEvent)

  const checks =
    FRP
    .periodic(checkIntervalMs, 0)
    .map(doPing)
    .await()
    .multicast()

  const drops =
    checks
    .filter((event) => (!event.data.isResponsive))
    .map(eventTypeUpdater(eventNames.drop))

  const pongs =
    checks
    .filter((event) => (event.data.isResponsive))
    .map(eventTypeUpdater(eventNames.pong))

  const changes =
    checks
    .scan(
      ([ , prev ], curr) => [ prev, curr ],
      [ null, null ]
    )
    .filter(([ prev, curr ]) => (
      curr &&
      (!prev || prev.data.isResponsive !== curr.data.isResponsive)
    ))
    .map(([ , curr ]) => curr)
    .map(eventTypeUpdater(eventNames.change))

  const downs =
    changes
    .filter((event) => (!event.data.isResponsive))
    .map(eventTypeUpdater(eventNames.down))

  const ups =
    changes
    .filter((event) => (event.data.isResponsive))
    .map(eventTypeUpdater(eventNames.up))

  const allEvents =
    FRP.mergeArray([
      checks,
      drops,
      pongs,
      changes,
      ups,
      downs,
    ])

  Object.assign(allEvents, {
    checks,
    drops,
    pongs,
    changes,
    downs,
    ups,
  })

  return allEvents
}






export default {
  create,
  eventNames,
}
export {
  create,
  eventNames,
}
