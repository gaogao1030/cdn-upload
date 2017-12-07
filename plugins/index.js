//config
//{
//  bucket: "xxxxxx",
//  remoteDirectory: "path/to/dir",
//  localDirectory: "path/to/dir",
//  cachedFile: "path/to/file",
//  adapter: "xxxx"
//}

const qiniu = require("./cdn_adapters/qiniu");
const cache = require("./cache");
let adapter;

const init = (config) => {
  switch(config.adapter) {
    case "qiniu":
      adapter = qiniu
      break;
    default:
      console.log(`No adapter: ${adapter}`)
      process.exit(0);
      break;
  }
  adapter.init(config);
  cache.init(config);
  return {
    adapter: adapter,
    cache: cache
  }
}

module.exports = {
  init: init
}
