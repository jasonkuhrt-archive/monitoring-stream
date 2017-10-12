import * as FRP from "most"

const eventNames = {
  check: "check",
  drop: "drop",
  pong: "pong",
  change: "change",
  down: "down",
  up: "up",
}

const toEventType = type => event =>
  Object.assign({}, event, {
    type,
  })

const CheckEvent = (isResponsive, data) => ({
  type: eventNames.check,
  isResponsive,
  data,
})

const createActionRunner = action => () => {
  let result
  try {
    return action()
      .then(data => CheckEvent(true, data))
      .catch(data => CheckEvent(false, data))
  } catch (error) {
    CheckEvent(false, error)
  }
}

const create = (action, checkIntervalMs = 1000) => {
  const checks = FRP.periodic(checkIntervalMs)
    .map(createActionRunner(action))
    .awaitPromises()
    .multicast()

  const drops = checks
    .filter(event => !event.data.isResponsive)
    .map(toEventType(eventNames.drop))

  const pongs = checks
    .filter(event => event.data.isResponsive)
    .map(toEventType(eventNames.pong))

  const changes = checks
    .scan(([, prev], curr) => [prev, curr], [null, null])
    .filter(
      ([prev, curr]) =>
        curr && (!prev || prev.data.isResponsive !== curr.data.isResponsive),
    )
    .map(([, curr]) => curr)
    .map(toEventType(eventNames.change))

  const downs = changes
    .filter(event => !event.data.isResponsive)
    .map(toEventType(eventNames.down))

  const ups = changes
    .filter(event => event.data.isResponsive)
    .map(toEventType(eventNames.up))

  const allEvents = FRP.mergeArray([checks, drops, pongs, changes, ups, downs])

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
export { create, eventNames }
