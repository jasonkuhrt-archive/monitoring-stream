import Monitor from "../source/main";

const action = () =>
  Math.round(Math.random())
    ? Promise.reject(new Error("This bad thing happened"))
    : Promise.resolve("OK!");

const monitor = Monitor.create(action, 1000);

monitor.ups
  .takeUntil(monitor.downs.takeUntil(monitor.ups).take(3))
  .take(1)
  .drain()
  .then(console.log.bind(null, "Finished awaiting availability with result: "));
