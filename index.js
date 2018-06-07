const flumeView = require('flumeview-reduce')
const { isInvite, isResponse } = require('ssb-invites-schema')
const { isFeedId } = require('ssb-ref')
const _ = require('lodash')

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
      find: find,
      all: view.get,
      stream: view.stream
    }

    function find (key, cb) {
      view.get((err, data) => {
        if (err) cb(err)
        for(var k in data) {
          var invites = data[k]
          if (!invites) continue
          var invite = invites.filter(invite => invite.id === key)[0]
          if (!invite) continue
          else {
            return cb(null, invite)
            break
          }
        }
        return cb(new Error('invite does not exist'))
      })
    }

    function findBy (keys, cb) {
      view.get((err, data) => {
        if (err) cb(err)
        for(var k in data) {
          var invites = data[k]
        }
      })
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
    var invites = _.get(accumulator, [root], new Set())
    if (branch) {
      var invites = _.values(_.merge(
        _.keyBy(invites, 'id'),
        _.keyBy([{ id: branch, response: { accepted: accept } }], 'id')
      ))
      accumulator[root] = invites
    } else {
      var recp = typeof recipient === 'string' ? recipient : recipient.link
      invites.add({ id, invite: { recipient: recp, body } })
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
