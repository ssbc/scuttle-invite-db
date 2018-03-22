const flumeView = require('flumeview-reduce')
const pull = require('pull-stream')
const get = require('lodash/get')

const FLUME_VIEW_VERSION = 1.0
const FLUME_VIEW_NAME = "invites"
const MSG_TYPE = "invite"

module.exports = {
  name: FLUME_VIEW_NAME,
  version: '1.0.0',
  manifest: {
    get: 'async',
    stream: 'source'
  },
  init: function (ssbServer, config) {
    console.log("*** Loaded ***")
    const view = ssbServer._flumeUse(
      FLUME_VIEW_NAME,
      flumeView(FLUME_VIEW_VERSION, reduce, map, null, {})
    )

    return {
      get: view.get,
      stream: view.stream
    }
  }
}

function reduce (accumulator, item) {
  var accumulator = accumulator || {}
  const { author, root, recipient } = item
  if (root) {
    var invites = get(accumulator, [root], new Set())
    invites.add(recipient)
    accumulator[root] = invites
  }
  console.log(accumulator)
  return accumulator
}

function map (msg) {
  const { author, content } = msg.value
  if (get(content, 'type') !== MSG_TYPE) return null
  return {
    author: author,
    root: content.root,
    recipient: content.recipient.link
  }
}
