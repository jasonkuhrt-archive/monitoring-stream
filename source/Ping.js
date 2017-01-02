import HTTPClient from "axios"



//    ping :: PingSettings -> Promise PingResultEvent
const ping = (config) => (
  HTTPClient(config)
  .then((result) => ({
    isResponsive: true,
    result
  }))
  .catch((error) => ({
    isResponsive: false,
    result: error
  }))
)



export default {
  ping,
}
export {
  ping,
}
