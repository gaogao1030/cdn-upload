const qiniu = require("qiniu")
const fs = require('fs')
const path = require('path')
const mime = require('mime')
const _Promise = require("bluebird");

let uploading = 0, uploaded = 0
let operations = []
let retryCount = 3
let failedFiles = [], uploadedFiles = []
let callback, localFile, key, putExtra, bucket
let mac, uploadToken, formUploader, bucketManager, conf
let remoteDirectory, localDirectory

// putExtra
// upload optional params
// @params fname   请求体中的文件的名称
// @params params  额外参数设置，参数名称必须以x:开头
// @param mimeType 指定文件的mimeType
// @param crc32    指定文件的crc32值
// @param checkCrc 指定是否检测文件的crc32值
// PutExtra(fname, params, mimeType, crc32, checkCrc)

const initialize = (config) => {
  mac = new qiniu.auth.digest.Mac(config.accessKey, config.secretKey)
  conf = new qiniu.conf.Config()

  conf.zone = qiniu.zone.Zone_z0
  conf.useHttpsDomain = true
  conf.useCdnDomain = true

  bucket = config.bucket
  bucketManager = new qiniu.rs.BucketManager(mac, conf)
  formUploader = new qiniu.form_up.FormUploader(conf)
  uploadToken = getUploadeToken({ scope: bucket })
  remoteDirectory = config.remoteDirectory
  localDirectory = config.localDirectory
}

const getUploadeToken = (options) => {
  let putPolicy = new qiniu.rs.PutPolicy(options)
  let token = putPolicy.uploadToken(mac)
  return token
}

const uploadFile = (file) => {
  return new Promise((resolve, reject) => {
    let err = undefined
    callback = (respErr, respBody, respInfo) => {
      info = {
        respInfo: respInfo,
        respBody: respBody,
        respErr: respErr
      }
      uploaded ++
      if (respErr) {
        err = { info: info, file: file }
        reject(err)
      } else if(respInfo.statusCode == 200) {
        resolve(file)
      } else {
        err = { info: info, file: file }
        reject(err)
      }
    }
    localFile = path.join(localDirectory, file)
    if (fs.existsSync(localFile)) {
      mimeType = mime.getType(file) || "application/octet-stream"
      putExtra = new qiniu.form_up.PutExtra(null, null, mimeType, null, null)
      key = path.join(remoteDirectory, file)
      uploading++
      formUploader.putFile(uploadToken, key, localFile, putExtra, callback)
    } else {
      err = { info: `${file} not exist` , file:file }
      reject(err)
    }
  })
}

const upload = (files, opts) => {
  let file = undefined
  if(files.length == 0){
    console.log("No files need upload")
    return new Promise((resolve, reject) => {
      resolve([])
    })
  }
  return new Promise((resolve, reject) => {
    _Promise.map(files, (file) => {
      return new Promise(async (_resolve, _reject) => {
        try {
          file = await uploadFile(file)
          console.log(`Upload success:\t${file}`)
          uploadedFiles.push(file)
          _resolve(file)
        } catch (err) {
          console.log(err)
          failedFiles.push(file)
          console.log(`Upload failed:\t${file}`)
          _resolve(file)
        }
      })
    }, opts).then((files) => {
      const returnObject = { failedFiles: failedFiles, uploadedFiles: uploadedFiles }
      retry(failedFiles)
      resolve(returnObject)
    })
  })
}

const remove = (files) => {
  return new Promise(async (resolve, reject) => {
    console.log(`********** Ready to remove files **********`)
    if(files.length == 0) { 
      console.log("No files need remove")
      resolve() 
    } else {
      console.log("Please wait while removing files...")
      operations = files.map((file) => {
        return qiniu.rs.deleteOp(bucket, file)
      })
      try {
        let { respInfo, respBody } = await _batch(operations)
        if(parseInt(respInfo.statusCode / 100) == 2) {
          let i = 0
          respBody.forEach((item) => {
            if(item.code == 200) {
              console.log(`Remove success:\t${files[i]}`)
            } else {
              console.log(`${item.code}\t${item.data.error}`)
            }
            i = i + 1
          })
        } else {
          console.log(respInfo.statusCode)
          console.log(respBody)
        }
        resolve()
      } catch (err) {
        console.log(err)
        reject(err)
      }
    }
  })
}

const changeMime = (keys) => {
  return new Promise(async (resolve, reject) => {
    let mimeTypes = {}
    if(keys.length == 0) { resolve() } else {
      operations = keys.map((key) => {
        mimeTypes[key] = mime.getType(key) || "application/octet-stream"
        return qiniu.rs.changeMimeOp(bucket, key, mimeTypes[key])
      })
      try {
        let { respInfo, respBody } = await _batch(operations)
        if(parseInt(respInfo.statusCode / 100) == 2) {
          let i = 0
          respBody.forEach((item) => {
            if(item.code == 200) {
              console.log(`${keys[i]} MimeTypeChanged:\t${mimeTypes[keys[i]]}`)
            } else {
              console.log(`${item.code}\t${item.data.error}`)
            }
            i = i + 1
          })
        } else {
          console.log(respInfo.statusCode)
          console.log(respBody)
        }
        resolve()
      } catch (err) {
          console.log(err)
          reject(err)
      }
    }
  })
}

const getCdnAssets = async () => {
  let options = {
    prefix: remoteDirectory,
    limit: 1000
  }
  let items = []
  try {
    let { respInfo, respBody } = await _listPrefix(bucket, options)
    if (respInfo.statusCode == 200) {
      //如果这个nextMarker不为空，那么还有未列举完毕的文件列表，下次调用listPrefix的时候，
      //指定options里面的marker为这个值
      let nextMarker = respBody.marker
      let commonPrefixes = respBody.commonPrefixes
      items = respBody.items
      items = items.map((item) => { return item.key })
    } else {
      console.log(respInfo.statusCode)
      console.log(respBody)
    }
    return items
  } catch (err) {
    console.log(err)
  }
}

const _listPrefix = (bucket, options) => {
  return new Promise((resolve, reject) => {
    bucketManager.listPrefix(bucket, options,  (err, respBody, respInfo) => {
      if (err) {
        reject(err)
      } else {
        resp = { respInfo: respInfo, respBody: respBody }
        resolve(resp)
      }
    })
  })
}


const _batch = (operations) => {
  return new Promise((resolve, reject) => {
    bucketManager.batch(operations, (err, respBody, respInfo) => {
      if(err) {
        reject(err)
      } else {
        resolve({ respInfo: respInfo, respBody: respBody })
      }
    })
  })
}

const retry = (files) => {
  if(files.length === 0){
    console.log(`\n[INFO] All files have been uploaded to Qiniu Storage`)
    console.log(`[INFO] Bucket: ${bucket}`)
    return
  }

  console.log(`\n[WARN] ${files.length} files upload failed\n${files.join("\n")}`)

  if(retryCount > 0){
    console.log("\n[INFO] The failed files will retry again")
    failedFiles = []
    uploadedFiles = []
    retryCount--
    upload(files)
  }
}

module.exports = {
  upload: upload,
  remove: remove,
  changeMime: changeMime,
  getCdnAssets: getCdnAssets,
  initialize: initialize
}
