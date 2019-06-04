const lib = require('../lib')
const path = require('path')
const { upload, validateConfig, readConf } = lib
const confPath = path.join(__dirname, 'config/cdn_upload.json')
const config = validateConfig(readConf(confPath), 'test', confPath)
upload(config)
