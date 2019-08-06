# cdn-upload

Synchronize all files in your specified local directory to the CDN (currently only supports qiniu)

## Installation

```
  $ npm install -g cdn-upload
```

## Usage

```
  Usage: cdn-upload <config path> [env]

  Upload file to cdn. the default configuration path for the configuration file is config/cdn_upload.json


  Options:

    -V, --version  output the version number
    -s, --sync     Make sure the local uploaded files is the same as the cdn files
    -h, --help     output usage information

  Examples:

    $ cdn-upload config/cdn_upload.json beta
    
```

## Test

```
  npm run test // run this command before ensure .env was configured and available
```

## Configuration

config/upload_assets.json:

```js
{
  "default": {
    "cachedFile": "../build/assets_cache.json",
    "localDirectory": "../public",
    "remoteDirectory": "test/public",
    "bucket": "your cdn bucket",
    "cdn": "qiniu",
    "envFile": ".env",
    "ignore": ['a.html', 'b/**/**'], // glob ignore sytax that a.html is localdirectory/a.html and b/**/** will localdirectory/b/**/**
    "concurrency": 8 // Number of concurrent processes (default: cpu count)
  },
  "beta": {
    "remoteDirectory": "test/beta/public",
    "concurrency": 4
  },
  "release": {
    "remoteDirectory": "test/release/public",
    "concurrency": 8
  },
  "production": {
    "remoteDirectory": "test/production/public",
    "concurrency": 16
  }
}
```

.env:

```
QINIU_ACCESS_KEY="qiniu access key"
QINIU_SECRET_KEY="qiniu secret key"
```

You should add .env and assets_cache.json files in .gitignore.

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/gaogao1030/cdn-upload.
