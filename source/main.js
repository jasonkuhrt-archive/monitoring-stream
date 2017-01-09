import * as FRP from "most"



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

const ActionOkRecord = (result) => ({
  isResponsive: true,
  result,
})

const ActionFailRecord = (result) => ({
  isResponsive: false,
  result,
})

const ActionChecker = (action) => {
  const checkAction = () =>
    action()
    .then(ActionOkRecord)
    .catch(ActionFailRecord)
    .then(CheckEvent)
  return checkAction
}

const create = (action, checkIntervalMs = 1000) => {

  const checks =
    FRP
    .periodic(checkIntervalMs, 0)
    .map(ActionChecker(action))
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

  return Object.assign(allEvents, {
    checks,
    drops,
    pongs,
    changes,
    downs,
    ups,
  })
}






export default {
  create,
  eventNames,
}
export {
  create,
  eventNames,
}
