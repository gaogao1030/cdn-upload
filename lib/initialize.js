//config
//{
//  bucket: "xxxxxx",
//  remoteDirectory: "path/to/dir",
//  localDirectory: "path/to/dir",
//  cachedFile: "path/to/file",
//  cdn: "xxxx"
//}

const qiniu = require("./cdn/qiniu")
const cache = require("./cache")
const { print } = require('./utils')

let cdn

const initialize = (config) => {
  switch(config.cdn) {
    case "qiniu":
      cdn = qiniu
      break
    default:
      print(`No cdn: ${cdn}`)
      process.exit(0)
      break
  }
  cdn.initialize(config)
  cache.initialize(config)
  return {
    cdn: cdn,
    cache: cache
  }
}

module.exports = {
  initialize: initialize
}
