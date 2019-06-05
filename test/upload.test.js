const lib = require('../lib')
const path = require('path')
const _ = require('lodash')
const { upload, validateConfig, readConf } = lib
const confPath = path.join(__dirname, 'config/cdn_upload.json')
const config = validateConfig(readConf(confPath), 'test', confPath)
const glob = require("glob")
process.env.NODE_ENV = 'test'

const { test } = require('tap')
const fs = require('fs')

const testUploadDir = `${__dirname}/upload.test/public/`
const testFiles = ['hello.go', 'hello.rb', 'hello.ex', 'hello.js', 'hello.c']
const toUploadFiles = (files) => {
  return files.map((file) => {
    return `${testUploadDir}${file}`
  })
}

const toRemoteFiles = (files) => {
  return files.map((file) => {
    return `${config.remoteDirectory}/${file}`
  })
}

const uploadFiles = toUploadFiles(testFiles)

const genFiles = (files) => {
  files.forEach((file) => {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(file))
    }
  })
}

const delFiles = (files) => {
  files.forEach((file) => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file)
    }
  })
}

const resetUpload = async () => {
  const files = glob.sync(`${config.localDirectory}/**/**/*`)
  delFiles(files)
  await upload(config)
}


const toStr = JSON.stringify

test('Upload Files Test', async (t) => {
  var res
  const testAddFiles = ['hello.coffee']
  const testDelFiles = ['hello.js', 'hello.go']
  const readyDelFiles = toUploadFiles(testDelFiles)
  const readyAddFiles = toUploadFiles(testAddFiles)

  await resetUpload()
  res = await upload(config)
  t.strictEqual(toStr(res.removeFiles), '[]')
  t.strictEqual(toStr(res.uploadedFiles), '[]')

  genFiles(uploadFiles)
  res = await upload(config)
  t.strictEqual(toStr(res.removeFiles), '[]')
  t.strictEqual(toStr(res.uploadedFiles.sort()), toStr(toRemoteFiles(testFiles.sort())))

  delFiles(readyDelFiles)
  genFiles(readyAddFiles)
  const previousUploadFiles = res.uploadedFiles.sort()
  res = await upload(config)
  const currentUploadFiles = res.uploadedFiles.sort()
  const addedFiles = _.difference(currentUploadFiles, previousUploadFiles)
  t.strictEqual(toStr(res.removeFiles), toStr(toRemoteFiles(testDelFiles.sort())))
  t.strictEqual(toStr(addedFiles.sort()), toStr(toRemoteFiles(testAddFiles.sort())))
})
