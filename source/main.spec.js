import F from "ramda"
import nock from "nock"
import Monitor from "./main"
const expect = global.expect


const fooURI = "https://foo.bar"

const createIntercept = (times) => {
  const uri = "http://localhost:9333" // TODO Randomize
  const intercept = nock(uri).get("/").times(times).reply(200)
  return {
    uri,
    intercept,
  }
}



it(".create returns an observable", () => {
  const monitor = Monitor.create(fooURI, 200)
  expect(typeof monitor.observe).toEqual("function")
})

it("observing the monitor starts it", () => {
  Monitor.create(fooURI, 200).take(1).drain()
})

it("monitor runs HTTP requets", () => {
  const { intercept, uri } = createIntercept(1)
  return (
    Monitor
    .create(uri, 200)
    .take(1)
    .drain()
    .then(() => intercept.done())
  )
})
