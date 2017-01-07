import F from "ramda"
import nock from "nock"
import Monitor from "./main"
const expect = global.expect

const uri = "http://localhost:9333"

const createIntercept = (times) =>
  nock(uri).get("/").times(times).reply(200)



let intercept

beforeEach(() => {
  intercept = createIntercept(1)
})

it(".observe starts the monitor", () => (
  Monitor
  .create(uri, 200)
  .take(1)
  .map(F.path([ "data", "isResponsive" ]))
  .observe((value) => expect(value).toEqual(true))
  .then(() => intercept.done())
))
