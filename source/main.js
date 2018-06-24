import * as FRP from "most";

const CheckEvent = (isResponsive, data, error) => ({
  isResponsive,
  data,
  error
});

const createActionRunner = action => () => {
  let result;
  try {
    return action()
      .then(data => CheckEvent(true, data, null))
      .catch(error => CheckEvent(false, null, error));
  } catch (error) {
    return Promise.resolve(CheckEvent(false, null, error));
  }
};

const isDown = event => !event.isResponsive;
const isUp = event => event.isResponsive;
const isChange = event => event.isResponsiveChanged;
const isFall = event => !event.isResponsive && event.isResponsiveChanged;
const isRise = event => event.isResponsive && event.isResponsiveChanged;

const create = (action, checkIntervalMs = 1000) => {
  const stream = FRP.periodic(checkIntervalMs)
    .map(createActionRunner(action))
    .awaitPromises()
    .scan(([, currPrev], currNow) => [currPrev, currNow], [null, null])
    // We skip 1 because our given scan seed of [null, null] is emitted into the stream as the initial scan output but we don't want it.
    .skip(1)
    .map(([prev, curr]) =>
      Object.assign(curr, {
        isResponsiveChanged: !prev || prev.isResponsive !== curr.isResponsive
      })
    )
    .multicast();

  return Object.assign(stream, {
    downs: stream.filter(isDown),
    ups: stream.filter(isUp),
    changes: stream.filter(isChange),
    falls: stream.filter(isFall),
    rises: stream.filter(isRise)
  });
};

export default { create, isDown, isUp, isChange, isFall, isRise };
export { create, isDown, isUp, isChange, isFall, isRise };
