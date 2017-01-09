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
  it("init -> up", () => {
    const m = Monitor.create(Action.ok, 20)
    const upEvent = FRP.fromPromise(m.ups.take(1).drain())
    return m
    .map(F.path(["type"]))
    .takeUntil(upEvent)
    .collect()
    .then(Assert.eq([ "check", "pong", "change", "up" ]))
  })

  it("init -> down", () => {
    const m = Monitor.create(Action.fail, 20)
    return m
    .map(F.path(["type"]))
    .take(4)
    .collect()
    .then(Assert.eq([ "check", "drop", "change", "down" ]))
  })

  it("up -> up", () => {
    const m = Monitor.create(Action.ok, 20)
    const twoPongEvents = FRP.fromPromise(m.pongs.take(2).drain())
    return m
    .map(F.path(["type"]))
    .takeUntil(twoPongEvents)
    .skip(4) // skip init -> up
    .collect()
    .then(Assert.eq([ "check", "pong" ]))
  })

  it("down -> down", () => {
    const m = Monitor.create(Action.fail, 20)
    const dropEvent = FRP.fromPromise(m.drops.take(2).drain())
    return m
    .map(F.path(["type"]))
    .takeUntil(dropEvent)
    .skip(4) // skip init -> down
    .collect()
    .then(Assert.eq([ "check", "drop" ]))
  })

  it("up -> down", () => {
    const m = Monitor.create(Action.loop([ Action.ok, Action.fail ]), 20)
    const downEvent = FRP.fromPromise(m.drops.take(1).drain())
    return m
    .map(F.path(["type"]))
    .takeUntil(downEvent)
    .skip(4) // skip init -> up
    .collect()
    .then(Assert.eq([ "check", "drop", "change", "down" ]))
  })

  it("down -> up", () => {
    const action = Action.loop([ Action.fail, Action.ok ])
    const m = Monitor.create(action, 20)
    const upEvent = FRP.fromPromise(m.ups.take(1).drain())
    return m
    .map(F.path(["type"]))
    .takeUntil(upEvent)
    .skip(4) // skip init -> down
    .collect()
    .then(Assert.eq([ "check", "pong", "change", "up" ]))
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
