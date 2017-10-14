/* eslint-disable */
import Monitor from "../source/main"
import Chai from "chai"
import F from "ramda"
import P from "bluebird"
import * as FRP from "most"

// Generic Helpers

FRP.Stream.prototype.collect = function() {
  return this.reduce((xs, x) => {
    xs.push(x)
    return xs
  }, [])
}

const Assert = Object.assign(Chai.assert, {
  eq: F.curry((ex, ac) => Assert.deepEqual(ac, ex)),
})

// Domain Helpers

const Action = {}

Action.ok = () => P.resolve(Action.ok.data)
Action.ok.data = 1

Action.fail = () => P.reject(Action.fail.value)
Action.fail.value = new Error("FAIL")

Action.loop = actions => {
  let callCount = 0
  return () => {
    if (callCount === actions.length) callCount = 0
    const result = actions[callCount]()
    callCount++
    return result
  }
}

const getEventData = F.path(["data"])

// Tests

it(".create returns an observable", () => {
  const monitor = Monitor.create(Action.ok, 20)
  Assert.eq("function", typeof monitor.observe)
})

it("observing the monitor starts it", () =>
  Monitor.create(Action.ok, 20)
    .take(1)
    .drain())

it("monitor recursively executes given action", () =>
  Monitor.create(Action.ok, 20)
    .map(getEventData)
    .take(4)
    .collect()
    .then(Assert.eq(F.repeat(Action.ok.data, 4))))

it("monitor events are of MonitorEvent type", () =>
  Monitor.create(Action.ok, 20)
    .take(1)
    .drain()
    .then(
      Assert.eq({
        isResponsive: true,
        isResponsiveChange: true,
        data: Action.ok.data,
      }),
    ))
