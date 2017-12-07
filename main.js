const program = require('commander');
const fs = require('fs');
const path = require('path');
const plugins = require("./plugins");
const glob = require("glob");
const cwd = process.cwd();
let defaultConfigFile = "cdn_upload.json";
let defaultConfigPath = path.join(`${cwd}/config`, defaultConfigFile);

require('dotenv').config();

const readConf = (path = configPath) => {
  if (fs.existsSync(path)) {
    try {
      const conf = JSON.parse(fs.readFileSync(path, 'utf8'));
      return conf
    } catch(e) {
      console.log(e);
      process.exit(0);
    }
  } else {
    console.log(`Config file: ${path} can't find.`);
    process.exit(0);
  }
}

const upload = async (config) => {
  config.accessKey = process.env.QINIU_ACCESS_KEY;
  config.secretKey = process.env.QINIU_SECRET_KEY;
  let { adapter, cache } = plugins.init(config);
  let files = glob.sync(`${config.localDirectory}/**/**/*`);
  let allUploadAssets = files.filter((file) => {
    if(!fs.lstatSync(file).isDirectory()){ return file };
  }).map((file) => {
    return file.replace(new RegExp(`^${config.localDirectory}`), '');
  })
  let needUploadAssets = cache.getDiff(allUploadAssets);
  cache.update(allUploadAssets);
  let cdnAssets = await adapter.getCdnAssets();
  let failedFiles = await adapter.upload(needUploadAssets);
  cdnAssets = cdnAssets.map((asset) => {
    return asset.replace(config.remoteDirectory, "");
  })
  needRemoveAssets = cache.getDiff(cdnAssets).map((asset) => {
    return `${config.remoteDirectory}${asset}`
  });
  adapter.remove(needRemoveAssets);
}

const validateArgs= (configPath, env) => {
  const argv = process.argv.slice(2);
  if(argv.length == 0){
    console.log('No enviroment given');
    process.exit(1);
  }
  if(argv.length == 1) {
    env = configPath
    configPath = defaultConfigPath
  }
  let config = readConf(configPath);
  let keys = Object.keys(config).filter((key) => { return key !== "default" })
  if(!keys.includes(env)) {
    console.log(`No ${env} enviroment in ${configPath}`);
    process.exit(1);
  }
  return config;
}

const validateConfig = (config, env, configPath) => {
  const requiredKeys = ["bucket", "remoteDirectory", "localDirectory",
    "accessKey", "secretKey", "cachedFile", "adapter"];
  let errFlag = false, keys, configDirecotry;
  config = Object.assign(config["default"], config[env]);
  switch(config.adapter) {
    case "qiniu":
      config.accessKey = process.env.QINIU_ACCESS_KEY;
      config.secretKey = process.env.QINIU_SECRET_KEY;
      break;
    default:
      console.log(`No adapter: ${config.adapter}`);
      errFlag = true;
      break;
  }
  keys = Object.keys(config);
  requiredKeys.forEach((requiredKey) => {
    if(!keys.includes(requiredKey)) {
      console.log(`Can't find ${requiredKey} in ${configPath}.`)
      errFlag = true;
    }
  })
  if(errFlag) { process.exit(0) }
  configDirecotry = path.resolve(configPath, "..");
  config.localDirectory = path.resolve(configDirecotry, config.localDirectory);
  config.cachedFile = path.resolve(configDirecotry, config.cachedFile);
  return config;
}

module.exports = {
  validateArgs: validateArgs,
  validateConfig: validateConfig,
  upload: upload
}
