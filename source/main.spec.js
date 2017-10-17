import M from "../source/main"
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

Action.loop = (...actions) => {
  let callCount = 0
  return () => {
    if (callCount === actions.length) callCount = 0
    const result = actions[callCount]()
    callCount++
    return result
  }
}

Action.script = actions => {
  let callCount = 0
  return () => {
    if (callCount === actions.length) {
      throw new Error("Script of actions exhausted")
      return Promise.resolve()
    }
    const result = actions[callCount]()
    callCount++
    return result
  }
}

const getEventData = F.path(["data"])

// Tests

it(".create returns an observable", () => {
  const monitor = M.create(Action.ok, 20)
  Assert.eq("function", typeof monitor.observe)
})

it("observing the monitor starts it", () =>
  M.create(Action.ok, 20)
    .take(1)
    .drain())

it("monitor recursively executes given action", () =>
  M.create(Action.ok, 20)
    .map(getEventData)
    .take(4)
    .collect()
    .then(Assert.eq(F.repeat(Action.ok.data, 4))))

it("if action synchronously fails then down state event", () =>
  M.create(() => {
    throw new Error("foobar")
  }, 10)
    .take(1)
    .collect()
    .then(F.nth(0))
    .then(event => {
      Assert.eq(event.error.message, "foobar")
    }))

it("unobserving then reobserving the monitor resets its state", async () => {
  const stream = M.create(Action.ok, 100)
  await stream
    .take(1)
    .collect()
    .then(F.nth(0))
    .then(M.isRise)
    .then(Assert.eq(true))
  await stream
    .take(1)
    .collect()
    .then(F.nth(0))
    .then(M.isRise)
    .then(Assert.eq(true))
})

const subStreamNames = ["ups", "downs", "rises", "falls", "changes"]

describe("instances have sub-streams", () => {
  subStreamNames.forEach(subStreamName => {
    it(`.${subStreamName}`, () => {
      const stream = M.create(Action.ok)
      Assert.eq(typeof stream[subStreamName], "object")
      Assert.eq(typeof stream[subStreamName].observe, "function")
    })
  })
})

const eventStateHelpers = ["isRise", "isFall", "isChange", "isDown", "isUp"]

describe("module has statically exported event state helper functions", () => {
  eventStateHelpers.forEach(eventStateHelper => {
    it(`.${eventStateHelper}`, () => {
      Assert.eq(typeof M[eventStateHelper] === "function")
    })
  })
})

it("monitor rises have the right MonitorEvent values", () =>
  M.create(Action.ok, 20)
    .take(1)
    .drain()
    .then(
      Assert.eq({
        isResponsive: true,
        isResponsiveChanged: true,
        data: Action.ok.data,
        error: null,
      }),
    ))

it("monitor falls have the right MonitorEvent values", () =>
  M.create(Action.fail, 20)
    .take(1)
    .drain()
    .then(
      Assert.eq({
        isResponsive: false,
        isResponsiveChanged: true,
        data: null,
        error: Action.fail.value,
      }),
    ))

const scenarios = [
  { description: "rise", actions: [Action.ok], expectedResults: [M.isRise] },
  { description: "fall", actions: [Action.fail], expectedResults: [M.isFall] },
  {
    description: "fall rise",
    actions: [Action.fail, Action.ok],
    expectedResults: [M.isFall, M.isRise],
  },
  {
    description: "rise fall",
    actions: [Action.ok, Action.fail],
    expectedResults: [M.isRise, M.isFall],
  },
  {
    description: "fall down down",
    actions: [Action.fail, Action.fail, Action.fail],
    expectedResults: [M.isFall, M.isDown],
  },
  {
    description: "rise up up",
    actions: [Action.ok, Action.ok, Action.ok],
    expectedResults: [M.isRise, M.isUp, M.isUp],
  },
  {
    description: "fall down down rise up fall",
    actions: [
      Action.fail,
      Action.fail,
      Action.fail,
      Action.ok,
      Action.ok,
      Action.fail,
    ],
    expectedResults: [M.isFall, M.isDown, M.isDown, M.isRise, M.isUp, M.isFall],
  },
  {
    description: "rise up up fall down up ",
    actions: [
      Action.ok,
      Action.ok,
      Action.ok,
      Action.fail,
      Action.fail,
      Action.ok,
    ],
    expectedResults: [M.isRise, M.isUp, M.isUp, M.isFall, M.isDown, M.isUp],
  },
]

const apply = (f, x) => f(x)

describe("action results lead to expected events of some state", () => {
  for (const scenario of scenarios) {
    it(`${scenario.description}`, () =>
      M.create(Action.script(scenario.actions), 10)
        .take(scenario.actions.length)
        .collect()
        .then(F.zipWith(apply, scenario.expectedResults))
        .then(F.map(Assert.eq(true))))
  }
})
