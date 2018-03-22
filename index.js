const flumeView = require('flumeview-reduce')
const pull = require('pull-stream')
const get = require('lodash/get')

const FLUME_VIEW_VERSION = 1.3
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
  const { root, recipient } = item
  if (root && recipient) {
    var invites = get(accumulator, [root], new Array())
    invite = invites.filter(invite => invite === recipient).length > 0
    if (!invite) invites.push(recipient)
    accumulator[root] = invites
  }
  return accumulator
}

function map (msg) {
  const { author, content } = msg.value
  if (get(content, 'type') !== MSG_TYPE) return null
  return {
    root: content.root,
    recipient: content.recipient.link
  }
}
