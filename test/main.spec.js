import Monitor from "../source/main"
const expect = global.expect


const fooURI = "https://foo.bar"

const createIntercept = (times) => {
  const uri = "http://localhost:9333"
  const intercept = nock(uri).get("/").times(times).reply(200)
  return {
    uri,
    intercept,
  }
}

afterEach(() => {
  Assert.isTrue(nock.isDone())
})

it(".create returns an observable", () => {
  const monitor = Monitor.create(fooURI, 20)
  expect(typeof monitor.observe).toEqual("function")
})

it("observing the monitor starts it", () => {
  Monitor.create(fooURI, 20).take(1).drain()
})

it("monitor recursively executes HTTP requests", () => {
  const { uri } = createIntercept(4)
  return Monitor
  .create(uri, 20)
  .checks
  .take(4)
  .drain()
})



it("events for: init -> up", () => {
  const { uri } = createIntercept(1)
  const m = Monitor.create(uri, 20)
  return m
  .map(F.path(["type"]))
  .takeUntil(FRP.fromPromise(m.ups.take(1).drain()))
  .collect()
  .then(Assert.eq([ "check", "pong", "change", "up" ]))
})

it("events for: init -> down", () => {
  const m = Monitor.create(fooURI, 20)
  return m
  .map(F.path(["type"]))
  .take(4)
  .collect()
  .then(Assert.eq([ "check", "drop", "change", "down" ]))
})

it("events for: up -> up", () => {
  const { uri } = createIntercept(2)
  const m = Monitor.create(uri, 20)
  return m
  .map(F.path(["type"]))
  .takeUntil(FRP.fromPromise(m.pongs.take(2).drain()))
  .skip(4) // skip init -> up
  .collect()
  .then(Assert.eq([ "check", "pong" ]))
})

it("events for: down -> down", () => {
  const m = Monitor.create(fooURI, 20)
  return m
  .map(F.path(["type"]))
  .takeUntil(FRP.fromPromise(m.drops.take(2).drain()))
  .skip(4) // skip init -> down
  .collect()
  .then(Assert.eq([ "check", "drop" ]))
})

it("events for: up -> down", () => {
  const { uri } = createIntercept(1)
  const m = Monitor.create(uri, 20)
  return m
  .map(F.path(["type"]))
  .takeUntil(FRP.fromPromise(m.drops.take(1).drain()))
  .skip(4) // skip init -> up
  .collect()
  .then(Assert.eq([ "check", "drop", "change", "down" ]))
})

it("events for: down -> up", () => {
  nock(fooURI).get("/").delay(21).reply(200)
  nock(fooURI).get("/").reply(200)
  const m = Monitor.create(fooURI, 20)
  return m
  .map(F.path(["type"]))
  .takeUntil(FRP.fromPromise(m.ups.take(1).drain()))
  .skip(4) // skip init -> down
  .collect()
  .then(Assert.eq([ "check", "pong", "change", "up" ]))
})



describe("sugar", () => {

  it(".drops has drop events", () => (
    Monitor
    .create(fooURI, 20)
    .drops
    .take(4)
    .map(F.path(["type"]))
    .collect()
    .then(Assert.eq(F.repeat("drop", 4)))
  ))

  it(".pongs has pong events", () => {
    nock(fooURI).get("/").times(4).reply(200)
    return Monitor
    .create(fooURI, 20)
    .pongs
    .take(4)
    .map(F.path(["type"]))
    .collect()
    .then(Assert.eq(F.repeat("pong", 4)))
  })

  it(".downs has down events", () => {
    const uri = "http://foo90.io"
    nock(uri).get("/").delay(21).reply(200)
    nock(uri).get("/").reply(200)
    nock(uri).get("/").delay(21).reply(200)
    nock(uri).get("/").reply(200)
    return Monitor
    .create(uri, 20)
    .downs
    .take(3)
    .map(F.path(["type"]))
    .collect()
    .then(Assert.eq(F.repeat("down", 3)))
  })

  it(".ups has up events", () => {
    const uri = "http://foo90.io"
    nock(uri).get("/").delay(21).reply(200)
    nock(uri).get("/").reply(200)
    nock(uri).get("/").delay(21).reply(200)
    nock(uri).get("/").reply(200)
    return Monitor
    .create(uri, 20)
    .ups
    .take(2)
    .map(F.path(["type"]))
    .collect()
    .then(Assert.eq(F.repeat("up", 2)))
  })

})



describe("request failures", () => {
  it("on 500 response .result is an error with .response", () => {
    const ServerError = {
      returnData: {
        message: "oops",
      },
      create: (times = 1) =>
        nock(fooURI)
        .get("/")
        .times(times)
        .reply(500, ServerError.returnData)
    }

    ServerError.create()

    return Monitor
    .create(fooURI, 20)
    .take(1)
    .observe(({ data: { result }}) => {
      Assert.isString(result.stack)
      Assert.isObject(result.response)
      Assert.isNumber(result.response.status)
      Assert.eq(ServerError.returnData, result.response.data)
    })
  })

  it("on ENOTFOUND .result is an error at the network level", () => {
    return Monitor
    .create("http://92hgd76120wm10.com", 20)
    .take(1)
    .observe(({ data: { result }}) => {
      Assert.isString(result.stack)
      Assert.eq("ENOTFOUND", result.code)
      Assert.eq(undefined, result.response)
    })
  })
})
