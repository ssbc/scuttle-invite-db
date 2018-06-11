const flumeView = require('flumeview-reduce')
const { isInvite, isResponse } = require('ssb-invites-schema')
const { isFeedId } = require('ssb-ref')
const _ = require('lodash')

const FLUME_VIEW_VERSION = 1.0
const FLUME_VIEW_NAME = "invites"

const getContent = (msg) => _.get(msg, 'value.content')
const getType = (msg) => _.get(msg, 'value.content.type')

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
      flumeView(
        FLUME_VIEW_VERSION,
        flumeReduceFunction, flumeMapFunction,
        null,
        flumeAccumulatorInitialState
      )
    )

    return {
      all: view.get,
      find: (id, cb) => withView(view, cb, findInvites.bind(null, id)),
      stream: () => {
        var source = defer.source()
        view.get((err, data) => {
          if (err) source.abort(err)
          else source.resolve(Object.values(data))
        })
        return source
      }
    }
  }
}

// Credit to Happy0! This is super neat way of drying up code
function withView (view, cb, fn) {
  view.get((err, msg) => {
    if (err) return cb(err)
    cb(null, fn(msg))
  })
}

function findInvites (key, cb) {
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

function handleInviteMessage (accumulator, msg) {
  const id = msg.key
  const { author, content } = msg.value
  const { root, recps, body, mentions } = content
  var rootData = accumulator[root] || {}
  var invites = rootData['invites'] || {}
  var recipient = recps.filter(recipient => recipient !== author)[0]

  if (recipient) {
    recipient = typeof recipient === 'string' ? recipient : recipient.link
    if (!isFeedId(recipient)) return
    invites[id] = { author, recipient, body, mentions }
    rootData['invites'] = invites
    accumulator[root] = rootData
  }
}

function handleResponseMessage (accumulator, msg) {
  const id = msg.key
  const { author, content } = msg.value
  const { root, branch, recps, accepted, body, mentions } = content
  var rootData = accumulator[root]
  var invites = rootData['invites']
  var invite = invites[branch]

  if (invite) {
    var responseData = { author, accepted, body, mentions }
    var localResponses = invite['responses']
    localResponses[id] = responseData
    var responses = rootData[id] || {}
    responses[id] = responseData
  }
}

function isOfInvitesSchema (content) {
  return isInvite(content) || isResponse(content)
}

function flumeReduceFunction (accumulator, msg) {
  var type = getType(msg)
  if (type === 'invite') {
    handleInviteMessage(accumulator, msg)
  } else if (type === 'response') {
    handleResponseMessage(accumulator, msg)
  }

  return accumulator
}

function flumeMapFunction (msg) {
  if (isOfInvitesSchema(getContent(msg))) {
    return msg
  }
}

function flumeAccumulatorInitialState () {
  return {}
}
