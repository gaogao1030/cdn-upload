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
You should ignore .env file, add .env in .gitignore.

## Usage

```
  Usage: cdn-upload cdn-upload <config path> [env]

  Upload assets to cdn. set config, defaults to config/cdn_upload.json


  Options:

    -V, --version  output the version number
    -h, --help     output usage information
  Examples:

    $ cdn-upload config/cdn_upload.json beta
    
```
## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/gaogao1030/cdn-upload.
