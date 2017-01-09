import Chai from "chai"
import nock from "nock"
import F from "ramda"
import P from "bluebird"
import * as FRP from "most"

FRP.Stream.prototype.collect = function () {
  return this.reduce(
    (xs, x) => { xs.push(x); return xs },
    []
  )
}

const Assert = Chai.assert


Object.assign(Assert, {
  eq: F.curry((ex, ac) => (
    Assert.deepEqual(ac, ex)
  ))
})

Object.assign(global, {
  Assert: Chai.assert,
  nock,
  F,
  FRP,
  P,
})
