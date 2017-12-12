# cdn-upload

Synchronize your local directory to cdn.


```
  //local directory has following files:
  js/a.js
  js/b.js
  main.css
  logo.svg
  
  // execute upload command and cdn will be has following files
  <remoteDirctory>/js/a.js
  <remoteDirctory>/js/b.js
  <remoteDirctory>/main.css
  <remoteDirctory>/logo.svg
  
  //remove main.css then excute upload command
  //cdn will be has following files
  <remoteDirctory>/js/a.js
  <remoteDirctory>/js/b.js
  <remoteDirctory>/logo.svg
  
  //create css/base.css and css/page.css
  //then execute upload command
  //cdn will be has following files
  <remoteDirctory>/js/a.js
  <remoteDirctory>/js/b.js
  <remoteDirctory>/css/base.css
  <remoteDirctory>/css/base.css
  <remoteDirctory>/logo.svg

```

## Installation

```
  $ npm install -g cdn-upload
```

## Configuration

config/upload_assets.json:

```js
{
  "default": {
    "cachedFile": "../build/assets_cache.json",
    "localDirectory": "../public",
    "remoteDirectory": "test/beta/public",
    "bucket": "your cdn bucket",
    "cdn": "qiniu" 
  },
  "beta": {
    "remoteDirectory": "test/beta/public"
  },
  "release": {
    "remoteDirectory": "test/release/public"
  },
  "production": {
    "remoteDirectory": "test/production/public"
  }
}
```

.env:

```
QINIU_ACCESS_KEY="qiniu access key"
QINIU_SECRET_KEY="qiniu secret key"

```
You should add .env and assets_cache.json files in .gitignore.

## Usage

```
  Usage: cdn-upload <config path> [env]

  Upload assets to cdn. set config, defaults to config/cdn_upload.json


  Options:

    -V, --version  output the version number
    -h, --help     output usage information
  Examples:

    $ cdn-upload config/cdn_upload.json beta
    
```
## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/gaogao1030/cdn-upload.
