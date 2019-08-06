const lib = require('../lib')
const path = require('path')
const _ = require('lodash')
const { upload, validateConfig, readConf } = lib
const confPath = path.join(__dirname, 'config/cdn_upload.json')
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

const toRemoteFiles = (files, config) => {
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

const resetUpload = async (config) => {
  const sync = true
  const files = glob.sync(`${config.localDirectory}/**/**/*`)
  delFiles(files)
  await upload(config, sync)
}


const toStr = JSON.stringify

test('Upload Files Test with Sync', async (t) => {
  var res
  const sync = true
  const config = validateConfig(readConf(confPath), 'beta', confPath)
  const testAddFiles = ['hello.coffee']
  const testDelFiles = ['hello.js', 'hello.go']
  const readyDelFiles = toUploadFiles(testDelFiles)
  const readyAddFiles = toUploadFiles(testAddFiles)

  await resetUpload(config)
  res = await upload(config, sync)
  t.strictEqual(toStr(res.removeFiles), '[]')
  t.strictEqual(toStr(res.uploadedFiles), '[]')

  genFiles(uploadFiles)
  res = await upload(config, sync)
  t.strictEqual(toStr(res.removeFiles), '[]')
  t.strictEqual(toStr(res.uploadedFiles.sort()), toStr(toRemoteFiles(testFiles.sort(), config)))

  delFiles(readyDelFiles)
  genFiles(readyAddFiles)
  const previousUploadFiles = res.uploadedFiles.sort()
  res = await upload(config, sync)
  const currentUploadFiles = res.uploadedFiles.sort()
  const addedFiles = _.difference(currentUploadFiles, previousUploadFiles)
  t.strictEqual(toStr(res.removeFiles), toStr(toRemoteFiles(testDelFiles.sort(), config)))
  t.strictEqual(toStr(addedFiles.sort()), toStr(toRemoteFiles(testAddFiles.sort(), config)))
})

test('Upload Files Test without Sync', async (t) => {
  const config = validateConfig(readConf(confPath), 'beta', confPath)
  var res
  const sync = false
  const testAddFiles = ['hello.coffee']
  const testDelFiles = ['hello.js', 'hello.go']
  const readyDelFiles = toUploadFiles(testDelFiles)
  const readyAddFiles = toUploadFiles(testAddFiles)

  await resetUpload(config)
  res = await upload(config, sync)
  t.strictEqual(toStr(res.removeFiles), '[]')
  t.strictEqual(toStr(res.uploadedFiles), '[]')

  genFiles(uploadFiles)
  res = await upload(config, sync)
  t.strictEqual(toStr(res.removeFiles), '[]')
  t.strictEqual(toStr(res.uploadedFiles.sort()), toStr(toRemoteFiles(testFiles.sort(), config)))

  delFiles(readyDelFiles)
  genFiles(readyAddFiles)
  const previousUploadFiles = res.uploadedFiles.sort()
  res = await upload(config, sync)
  const currentUploadFiles = res.uploadedFiles.sort()
  const addedFiles = _.difference(currentUploadFiles, previousUploadFiles)
  t.strictEqual(toStr(res.removeFiles), '[]')
  t.strictEqual(toStr(addedFiles.sort()), toStr(toRemoteFiles(testAddFiles.sort(), config)))
})
