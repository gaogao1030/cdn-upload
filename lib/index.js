const fs = require('fs')
const path = require('path')
const plugins = require("./initialize")
const glob = require("glob")
const cwd = process.cwd()
const _  = require('lodash')
const os = require('os')
const maxConcurrency = 16
const cpuCount = os.cpus().length 
const concurrency = cpuCount >= maxConcurrency ? maxConcurrency : cpuCount

let defaultConfigFile = "cdn_upload.json"
let defaultConfigPath = path.join(`${cwd}/config`, defaultConfigFile)

const readConf = (path = configPath) => {
  if (fs.existsSync(path)) {
    try {
      const conf = JSON.parse(fs.readFileSync(path, 'utf8'))
      return conf
    } catch(e) {
      console.log(e)
      process.exit(0)
    }
  } else {
    console.log(`Config file: ${path} can't find.`)
    process.exit(0)
  }
}

const getLocalDirectoryFiles = (config) => {
  let ignore = config.ignore && config.ignore.map((pattern) => {
    return `${config.localDirectory}/${pattern}`
  })
  ignore = ignore || []
  const files = glob.sync(`${config.localDirectory}/**/**/*`, { ignore: ignore })
  .filter((file) => {
    if(!fs.lstatSync(file).isDirectory()){ return file }
  })
  return removePrefixForFiles(files, new RegExp(`^${config.localDirectory}`))
}

const removePrefixForFiles = (files, prefix) => {
  return files.map((file) => {
    return file.replace(prefix, "")
  })
}

const addPrefixForFiles = (files, prefix) => {
  return files.map((file) => {
    return prefix + file
  })
}

const upload = async (config) => {
  const { cdn, cache } = plugins.initialize(config)

  const localFiles = getLocalDirectoryFiles(config)
  const remoteFiles = addPrefixForFiles(localFiles, config.remoteDirectory)
  const diffFiles = cache.getDiff(remoteFiles)
  const readyUploadFiles = removePrefixForFiles(diffFiles, config.remoteDirectory)
  cache.update(remoteFiles)

  const cdnAssets = await cdn.getCdnAssets()
  console.log(`********** Ready to upload files **********`)
  const opts = {
    concurrency: config.concurrency || concurrency
  } 
  const { failedFiles, uploadedFiles } = await cdn.upload(readyUploadFiles, opts)
  cache.filterFailedFiles(failedFiles)
  readyRemoveFiles = cache.getDiff(cdnAssets)
  await cdn.remove(readyRemoveFiles)
  //if(needUploadAssets.length > 0) {
  //  let needChangeKeys = needUploadAssets.map((asset) => {
  //    return path.join(config.remoteDirectory, asset)
  //  })
  //  await cdn.changeMime(needChangeKeys)
  //}
}

const validateArgs = (configPath, env) => {
  const argv = process.argv.slice(2)
  if(argv.length == 0){
    console.log('No enviroment given');
    process.exit(1);
  }
  if(argv.length == 1) {
    env = configPath
    configPath = defaultConfigPath
  }
  return { configPath, env }
}

const exit = (signal) => {
  process.exit(signal)
}

const validateConfig = (config, env, configPath) => {
  const stages = Object.keys(config)
  const filterStages = stages.filter((key) => { return key !== "default" })
  if(!filterStages.includes(env)) {
    console.log(`No ${env} enviroment in ${configPath}`)
    process.exit(1)
  }
  const requiredKeys = ["bucket", "remoteDirectory", "localDirectory",
    "accessKey", "secretKey", "cachedFile", "cdn"]
  let errFlag = false
  config = Object.assign(config["default"], config[env])
  require('dotenv').config({ path: config.envFile || ".env" })
  switch(config.cdn) {
    case "qiniu":
      config.accessKey = process.env.QINIU_ACCESS_KEY
      config.secretKey = process.env.QINIU_SECRET_KEY
      break
    default:
      console.log(`No cdn: ${config.cdn}`)
      errFlag = true
      break
  }
  const configKeys = Object.keys(config)
  requiredKeys.forEach((requiredKey) => {
    if (!configKeys.includes(requiredKey)) {
      console.log(`Can't find ${requiredKey} in ${configPath}.`)
      errFlag = true
    }
  })
  if (config.remoteDirectory.match('/$') !== null) {
    console.log("Please remove the '/' at the end of 'remoteDirectory' in the", configPath)
    errFlag = true
  }
  if(errFlag) { process.exit(0) }
  config.localDirectory = path.resolve(configPath, "..", config.localDirectory)
  config.cachedFile = path.resolve(configPath, "..", config.cachedFile)
  return config
}

module.exports = {
  readConf,
  validateArgs,
  validateConfig,
  getLocalDirectoryFiles,
  upload
}
