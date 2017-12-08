//config
//{
//  bucket: "xxxxxx",
//  remoteDirectory: "path/to/dir",
//  localDirectory: "path/to/dir",
//  cachedFile: "path/to/file",
//  cdn: "xxxx"
//}

const qiniu = require("./cdn/qiniu");
const cache = require("./cache");
let cdn;

const initialize = (config) => {
  switch(config.cdn) {
    case "qiniu":
      cdn = qiniu
      break;
    default:
      console.log(`No cdn: ${cdn}`)
      process.exit(0);
      break;
  }
  cdn.initialize(config);
  cache.initialize(config);
  return {
    cdn: cdn,
    cache: cache
  }
}

module.exports = {
  initialize: initialize
}
