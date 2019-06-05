const fs = require('fs')
const path = require('path')
const cwd = process.cwd()

const defaultConfigFile = "cdn_upload.json"
const defaultConfigPath = path.join(`${cwd}/config`, defaultConfigFile)

const readConf = (path = configPath) => {
  if (fs.existsSync(path)) {
    try {
      const conf = JSON.parse(fs.readFileSync(path, 'utf8'))
      return conf
    } catch(e) {
      console.error(e)
      process.exit(0)
    }
  } else {
    print(`Config file: ${path} can't find.`)
    process.exit(0)
  }
}

const validateArgs = (configPath, env) => {
  const argv = process.argv.slice(2)
  if(argv.length == 0){
    print('No enviroment given');
    process.exit(1);
  }
  if(argv.length == 1) {
    env = configPath
    configPath = defaultConfigPath
  }
  return { configPath, env }
}

const validateConfig = (config, env, configPath) => {
  const stages = Object.keys(config)
  const filterStages = stages.filter((key) => { return key !== "default" })
  if (!filterStages.includes(env)) {
    print(`No ${env} enviroment in ${configPath}`)
    process.exit(1)
  }
  const requiredKeys = ["bucket", "remoteDirectory", "localDirectory",
    "accessKey", "secretKey", "cachedFile", "cdn"]
  let errFlag = false
  config = Object.assign(config["default"], config[env])
  require('dotenv').config({ path: config.envFile || ".env" })
  switch (config.cdn) {
    case "qiniu":
      config.accessKey = process.env.QINIU_ACCESS_KEY
      config.secretKey = process.env.QINIU_SECRET_KEY
      break
    default:
      print(`No cdn: ${config.cdn}`)
      errFlag = true
      break
  }
  const configKeys = Object.keys(config)
  requiredKeys.forEach((requiredKey) => {
    if (!configKeys.includes(requiredKey)) {
      print(`Can't find ${requiredKey} in ${configPath}.`)
      errFlag = true
    }
  })
  if (config.remoteDirectory.match('/$') !== null) {
    print("Please remove the '/' at the end of 'remoteDirectory' in the", configPath)
    errFlag = true
  }
  if (errFlag) { process.exit(0) }
  config.localDirectory = path.resolve(configPath, "..", config.localDirectory)
  config.cachedFile = path.resolve(configPath, "..", config.cachedFile)
  return config
}

const print = (message) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(message)
  }
}

module.exports = {
  print,
  validateArgs,
  validateConfig,
  readConf
}
