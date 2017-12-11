const qiniu = require("qiniu");
const fs = require('fs');
const path = require('path');

let uploading = 0, uploaded = 0;
let operations = []
let retryCount = 3;
let failedFiles = [], uploadedFiles = [];
let callback, localFile, key, putExtra, bucket;
let mac, uploadToken, formUploader, bucketManager, conf;
let remoteDirectory, localDirectory;

const initialize = (config) => {
  mac = new qiniu.auth.digest.Mac(config.accessKey, config.secretKey);
  conf = new qiniu.conf.Config();

  conf.zone = qiniu.zone.Zone_z0;
  conf.useHttpsDomain = true;
  conf.useCdnDomain = true;

  bucket = config.bucket
  putExtra = new qiniu.form_up.PutExtra();
  bucketManager = new qiniu.rs.BucketManager(mac, conf);
  formUploader = new qiniu.form_up.FormUploader(conf);
  uploadToken = getUploadeToken({scope: bucket});
  remoteDirectory = config.remoteDirectory;
  localDirectory = config.localDirectory;
}

const getUploadeToken = (options) => {
  let putPolicy = new qiniu.rs.PutPolicy(options);
  let token = putPolicy.uploadToken(mac);
  return token;
}


const uploadFile = (file) => {
  return new Promise((resolve, reject) => {
    let err = undefined;
    callback = (respErr, respBody, respInfo) => {
      info = {
        respInfo: respInfo,
        respBody: respBody,
        respErr: respErr
      }
      uploaded ++;
      if (respErr) {
        err = { info: info, file: file };
        reject(err);
      } else if(respInfo.statusCode == 200) {
        resolve(file);
      } else {
        err = { info: info, file: file };
        reject(err);
      }
    };
    localFile = path.join(localDirectory, file);
    if (fs.existsSync(localFile)) {
      key = path.join(remoteDirectory, file);
      uploading++;
      formUploader.putFile(uploadToken, key, localFile, putExtra, callback);
    } else {
      err = { info: `${file} not exist` , file:file };
      reject(err);
    }
  })
}

const upload = (files) => {
  let file = undefined;
  if(files.length == 0){
    console.log("No files need upload");
    return new Promise((resolve, reject) => {
      resolve([]);
    })
  };
  const promises = files.map((file) => {
    return new Promise(async (resolve, reject) => {
      try {
        file = await uploadFile(file);
        console.log(`Upload success:\t${file}`);
        uploadedFiles.push(file);
        resolve(file);
      } catch (err) {
        //const { info, file } = err;
        //console.log(`code: ${info.respInfo.statusCode}`);
        //console.log(info.respInfo);
        //console.log(info.respErr);
        //console.log(info.respBody);
        console.log(err);
        failedFiles.push(file);
        console.log(`Upload failed:\t${file}`);
        resolve(file);
      }
    })
  });
  return new Promise((resolve, reject) => {
    Promise.all(promises).then((files) => {
      retry(failedFiles);
      resolve(failedFiles);
    })
  })
}

const remove = async (files) => {
  if(files.length == 0) { return }
  operations = files.map((file) => {
    return qiniu.rs.deleteOp(bucket, file)
  })
  try {
    let { respInfo, respBody } = await _batch(operations);
    if(parseInt(respInfo.statusCode / 100) == 2) {
      let i = 0;
      respBody.forEach((item) => {
        if(item.code == 200) {
          console.log(`Removed:\t${files[i]}`)
          //console.log(`${item.code}\tsuccess`);
        } else {
          console.log(`${item.code}\t${item.data.error}`);
        }
        i = i + 1;
      });
    } else {
      console.log(respInfo.deleteusCode);
      console.log(respBody);
    }
  } catch (err) {
    console.log(err);
  }
}

const getCdnAssets = async () => {
  let options = {
    prefix: remoteDirectory,
    limit: 1000
  }
  let items = [];
  try {
    let { respInfo, respBody } = await _listPrefix(bucket, options);
    if (respInfo.statusCode == 200) {
      //如果这个nextMarker不为空，那么还有未列举完毕的文件列表，下次调用listPrefix的时候，
      //指定options里面的marker为这个值
      let nextMarker = respBody.marker;
      let commonPrefixes = respBody.commonPrefixes;
      items = respBody.items;
      items = items.map((item) => { return item.key })
    } else {
      console.log(respInfo.statusCode);
      console.log(respBody);
    }
    return items;
  } catch (err) {
    console.log(err);
  }
}

const _listPrefix = (bucket, options) => {
  return new Promise((resolve, reject) => {
    bucketManager.listPrefix(bucket, options,  (err, respBody, respInfo) => {
      if (err) {
        reject(err);
      } else {
        resp = { respInfo: respInfo, respBody: respBody };
        resolve(resp);
      }
    });
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
    //console.log(`\n[INFO] 全部文件已上传至七牛:${bucket}存储空间`);
    console.log(`\n[INFO] All files was uploaded in qiniu storage`);
    console.log(`\n[INFO] Bucket: ${bucket}`);
    return;
  }

  //console.log(`\n[WARN] 以下 ${files.length} 个文件上传失败\n${files.join("\n")}`);
  console.log(`\n[WARN] ${files.length} files upload failed\n${files.join("\n")}`);

  if(retryCount > 0){
    //console.log("\n[INFO] 将要重新上传以上文件");
    console.log("\n[INFO] These failed files will retry again");
    failedFiles = [];
    uploadedFiles = [];
    retryCount--;
    upload(files);
  }
}

module.exports = {
  upload: upload,
  remove: remove,
  getCdnAssets: getCdnAssets,
  initialize: initialize
}
