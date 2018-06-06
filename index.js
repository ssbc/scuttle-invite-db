const flumeView = require('flumeview-reduce')
const { isInvite, isResponse } = require('ssb-invites-schema')
const { isFeedId } = require('ssb-ref')
const get = require('lodash/get')

const FLUME_VIEW_VERSION = 1.0
const FLUME_VIEW_NAME = "invites"
const MSG_TYPE = "invite"

module.exports = {
  name: FLUME_VIEW_NAME,
  version: require('./package.json').version,
  manifest: {
    find: 'async',
    all: 'async',
    stream: 'source'
  },
  init: function (server, config) {
    const view = server._flumeUse(
      FLUME_VIEW_NAME,
      flumeView(FLUME_VIEW_VERSION, reduce, map, null, {})
    )

    return {
      find: (key, cb) => {
        view.get((err, data) => {
          if (err) cb(err)
          for(var k in data) {
            var root = data[k]
            if (!root) continue
            var invite = root.filter(inv => inv.id === key)[0]
            if (!invite) {
              return cb(new Error('No invite with that id'))
              break
            } else {
              return cb(null, invite)
              break
            }
          }
          return cb(new Error('invite key has no root'))
        })
      },
      all: view.get,
      stream: view.stream
    }
  }
}

function reduce (accumulator, item) {
  const {
    root, branch, id,
    author, recipient, body,
    mentions, accept
  } = item

  if (root && recipient) {
    var invites = get(accumulator, [root], new Set())
    if (branch) {
      invites = invites
        .filter(invite => invite.id === id && invite.recipient === author)
        .map(invite => invite.accepted = accept)
      accumulator[root] = invites
    } else {
      var recp = typeof recipient === 'string' ? recipient : recipient.link
      invites.add({ id, recipient: recp, body })
      accumulator[root] = Array.from(invites)
    }
  }
  return accumulator
}

function map (msg) {
  const { author, content } = msg.value
  if (!isInvite(content) && !isResponse(content)) return null
  var recipient = content.recps
    .filter(recipient => recipient !== author)[0]

  return {
    root: content.root,
    branch: content.branch,
    id: msg.key,
    author: author,
    recipient: recipient,
    body: content.body,
    accept: content.accept
  }
}
