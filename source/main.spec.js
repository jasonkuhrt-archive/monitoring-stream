import Monitor from "../source/main"
import Chai from "chai"
import F from "ramda"
import P from "bluebird"
import * as FRP from "most"



FRP.Stream.prototype.collect = function () {
  return this.reduce(
    (xs, x) => { xs.push(x); return xs },
    []
  )
}

const Assert = Object.assign(Chai.assert, {
  eq: F.curry((ex, ac) => (
    Assert.deepEqual(ac, ex)
  ))
})

const Action = {}

Action.ok = () =>
  P.resolve("OK")

Action.fail = () =>
  P.reject(new Error("FAIL"))

Action.loop = (actions) => {
  let callCount = 0
  return () => {
    if (callCount === actions.length) callCount = 0
    const result = actions[callCount]()
    callCount++
    return result
  }
}



it(".create returns an observable", () => {
  const monitor = Monitor.create(Action.ok, 20)
  Assert.eq("function", typeof monitor.observe)
})

it("observing the monitor starts it", () => {
  Monitor.create(Action.ok, 20).take(1).drain()
})

it("monitor recursively executes given action", () => (
  Monitor
  .create(Action.ok, 20)
  .checks
  .map(F.path([ "data", "result" ]))
  .take(4)
  .collect()
  .then(Assert.eq(F.repeat("OK",4)))
))



describe("events from state changes", () => {
  const eventsUp = [ "check", "pong", "change", "up" ]
  const eventsDown = [ "check", "drop", "change", "down" ]
  const cases = [{
    name: "init -> up",
    action: Action.ok,
    stopSignal: (m) => FRP.fromPromise(m.ups.take(1).drain()),
    expectedEvents: eventsUp,
  },{
    name: "init -> down",
    action: Action.fail,
    stopSignal: (m) => FRP.fromPromise(m.downs.take(1).drain()),
    expectedEvents: eventsDown,
  },{
    name: "up -> up",
    action: Action.ok,
    stopSignal: (m) => FRP.fromPromise(m.pongs.take(2).drain()),
    expectedEvents: [ ...eventsUp, "check", "pong" ],
  },{
    name: "down -> down",
    action: Action.fail,
    stopSignal: (m) => FRP.fromPromise(m.drops.take(2).drain()),
    expectedEvents: [ ...eventsDown, "check", "drop" ],
  },{
    name: "up -> down",
    action: Action.loop([ Action.ok, Action.fail ]),
    stopSignal: (m) => FRP.fromPromise(m.drops.take(1).drain()),
    expectedEvents: [ ...eventsUp, ...eventsDown ],
  },{
    name: "down -> up",
    action: Action.loop([ Action.fail, Action.ok ]),
    stopSignal: (m) => FRP.fromPromise(m.ups.take(1).drain()),
    expectedEvents: [ ...eventsDown, ...eventsUp ],
  }]

  cases.map(({ name, action, stopSignal, expectedEvents }) => {
    it(name, () => {
      const m = Monitor.create(action, 20)
      return m
      .map(F.path(["type"]))
      .takeUntil(stopSignal(m))
      .collect()
      .then(Assert.eq(expectedEvents))
    })
  })
})



describe("sub-streams", () => {
  [
    [ "checks", "check", Action.ok ],
    [ "drops", "drop", Action.fail ],
    [ "pongs", "pong", Action.ok ],
    [ "changes", "change", Action.loop([ Action.fail, Action.ok ]) ],
    [ "downs", "down", Action.loop([ Action.fail, Action.ok ]) ],
    [ "ups", "up", Action.loop([ Action.fail, Action.ok ]) ],
  ]
  .map(([ prop, event, action ]) => {
    it(`.${prop} has only ${event} events`, () => (
      Monitor
      .create(action, 20)[prop]
      .take(4)
      .map(F.path(["type"]))
      .collect()
      .then(Assert.eq(F.repeat(event, 4)))
    ))
  })
})
