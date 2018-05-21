const flumeView = require('flumeview-reduce')
const pull = require('pull-stream')
const get = require('lodash/get')
const extend = require('xtend')

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
  const { root, recipient, text, mentions } = item
  if (root && recipient ) {
    console.log(recipient)
    var invites = get(accumulator, [root], new Array())
    var recp = typeof recipient === 'string' ? recipient : recipient.link
    invite = invites.filter(invite => invite.id === recp).length > 0
    if (!invite) invites.push({ id: recp, text: text })
    accumulator[root] = invites
  }
  return accumulator
}

function map (msg) {
  const { author, content } = msg.value
  if (get(content, 'type') !== MSG_TYPE) return null
  var recipient = content.recps.filter(recipient => recipient !== get(msg, "value.author"))[0]
  return {
    root: content.root,
    recipient: recipient,
    text: content.text
  }
}
