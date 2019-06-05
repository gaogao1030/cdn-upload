const { test } = require('tap')
const fs = require('fs')
const cache = require('../lib/cache')

const cachedFile = `${__dirname}/.cache.test.json`

test('Cache Plugin Test', async (t) => {
  const files = ['test/hello.js', 'test/hello.rb','test/hello.go', 'test/hello.ex', 'test/hello.rs']
  const failedFiles = ['test/hello.go', 'test/hello.ex']
  const diffFiles = ['test/hello.js', 'test/hello.rb', 'test/hello.rs']
  if (fs.existsSync(cachedFile)) {
    fs.unlinkSync(cachedFile)
  }
  t.strictEqual(fs.existsSync(cachedFile), false)
  cache.initialize({ cachedFile })
  t.strictEqual(fs.existsSync(cachedFile), true)
  t.strictEqual(JSON.stringify(cache.read()), '[]')
  cache.update(files)
  t.strictEqual(JSON.stringify(cache.read()), JSON.stringify(files))
  cache.filterFailedFiles(failedFiles)
  t.strictEqual(JSON.stringify(cache.read()), JSON.stringify(diffFiles))
  fs.unlinkSync(cachedFile)
})
