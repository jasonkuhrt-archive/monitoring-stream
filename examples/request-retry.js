import Monitor from "../source/main"

const action = () =>
  Boolean(Math.round(Math.random()))
    ? Promise.reject(new Error("This bad thing happened"))
    : Promise.resolve("OK!")

const monitor = Monitor.create(action, 1000)

const maxRetries = monitor.pongs
  .takeUntil(monitor.drops.takeUntil(monitor.pongs).take(3))
  .take(1)
  .drain()
  .then(console.log.bind(null, "Finished awaiting availability with result: "))
