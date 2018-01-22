const fs = require('fs');
const _  = require('lodash');
let assetsCached, diffAssets, cachedFile, reverseDiffAssets;

const initialize = (config) => {
  cachedFile = config.cachedFile;
  if(!fs.existsSync(cachedFile)) {
    fs.writeFileSync(cachedFile, JSON.stringify([]));
  }
}

const read = () => {
  return JSON.parse(fs.readFileSync(cachedFile, 'utf8'));
}

const getDiff = (sourceAssets, reverse = false) => {
  assetsCached = read();
  if(reverse){
    return _.difference(assetsCached, sourceAssets);
  } else {
    return  _.difference(sourceAssets, assetsCached);
  }
}

const update = (assets) => {
  diffAssets = getDiff(assets); //ensure diffAssets it's real diff Assets
  reverseDiffAssets = getDiff(assets, true);
  assetsCached = read();
  assetsCached = assetsCached.concat(diffAssets);
  assetsCached = assetsCached.filter((asset) => {
    return !reverseDiffAssets.includes(asset)
  })
  fs.writeFileSync(cachedFile, JSON.stringify(assetsCached));
}

const filterFailedFiles = (failedFiles = []) => {
  assetsCached = read();
  assetsCached = assetsCached.filter((asset) => {
    return !failedFiles.includes(asset);
  })
  fs.writeFileSync(cachedFile, JSON.stringify(assetsCached));
}

module.exports = {
  initialize: initialize,
  read: read,
  getDiff: getDiff,
  update: update,
  filterFailedFiles: filterFailedFiles
}
