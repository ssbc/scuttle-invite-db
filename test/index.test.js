const Server = require('scuttle-testbot')
const Keys = require('ssb-keys')
const test = require('tape')
const pry = require('pryjs')
const pull = require('pull-stream')

Server.use(require('../index.js'))

var keys = Keys.generate()

var server = Server({
  name: 'test0000',
  keys: keys
})

var feed = server.createFeed(keys)

test("Publish Invite", t => {
  feed.add({
    type: "invite",
    recps: [
      "@Msdf2S8sdfKJasdsA98Uasdfkjsd/ASdfsdfsdfa=ss=.ed25519",
      "@NeB4q4Hy9IiMxs5L08oevEhivxW+/aDu/s/0SkNayi0=.ed25519"
    ]
  }, (err, msg) => {
  })
})

