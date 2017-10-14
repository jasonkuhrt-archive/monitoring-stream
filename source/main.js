import * as FRP from "most"

const CheckEvent = (isResponsive, data, error) => ({
  isResponsive,
  data,
  error,
})

const createActionRunner = action => () => {
  let result
  try {
    return action()
      .then(data => CheckEvent(true, data, null))
      .catch(error => CheckEvent(false, null, error))
  } catch (error) {
    CheckEvent(false, null, error)
  }
}

const create = (action, checkIntervalMs = 1000) => {
  const stream = FRP.periodic(checkIntervalMs)
    .map(createActionRunner(action))
    .awaitPromises()
    .scan(([, currPrev], currNow) => [currPrev, currNow], [null, null])
    // We skip 1 because our given scan seed of [null, null] is emitted into the stream as the initial scan output but we don't want it.
    .skip(1)
    .map(([prev, curr]) =>
      Object.assign(curr, {
        isResponsiveChange: !prev || prev.isResponsive === curr.isResponsive,
      }),
    )
    .multicast()

  const drops = stream.filter(event => !event.isResponsive)

  const pongs = stream.filter(event => event.isResponsive)

  const changes = stream.filter(event => event.isResponsiveChange)

  const downs = changes.filter(
    event => !event.isResponsive && event.isResponsiveChange,
  )

  const ups = changes.filter(
    event => event.isResponsive && event.isResponsiveChange,
  )

  return Object.assign(stream, {
    drops,
    pongs,
    changes,
    downs,
    ups,
  })
}

export default { create }
export { create }
