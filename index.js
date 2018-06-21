const flumeView = require('flumeview-reduce')
const defer = require('pull-defer')
const iterable = require('pull-iterable')

const getContent = require('ssb-msg-content')

const {
  isInvite,
  isReply
} = require('ssb-invites-schema')


const FLUME_VIEW_VERSION = 1.0
const FLUME_VIEW_NAME = "invites"

module.exports = {
  name: FLUME_VIEW_NAME,
  version: require('./package.json').version,
  manifest: {
    getInvite: 'async',
    getReply: 'async',
    invitesByRoot: 'async',
    repliesByRoot: 'async',
    invitedByRoot: 'async'
  },
  init: function (server, config) {
    const view = server._flumeUse(
      FLUME_VIEW_NAME,
      flumeView(
        FLUME_VIEW_VERSION,
        flumeReduceFunction, flumeMapFunction,
        null,
        flumeAccumulatorInitialState()
      ))

    return {
      getInvite: (id, callback) => withView(view, callback, getInvite.bind(null, id)),
      getReply: (id, callback) => withView(view, callback, getReply.bind(null, id)),
      invitesByRoot: (root, callback) => withView(view, callback, byRoot.bind(null, root, 'invites')),
      repliesByRoot: (root, callback) => withView(view, callback, byRoot.bind(null, root, 'replies')),
      invitedByRoot: (id, callback) => withView(view, callback, invitedByRoot.bind(null, id))
    }
  }
}

// Credit to Happy0! This is super neat way of drying up code
function withView (view, callback, fn) {
  view.get((err, data) => {
    if (err) return callback(err)
    fn(data, callback)
  })
}

function getRoot(data, callback) {
  for(var k in data) {
    success = callback(data[k])
    if (success) return success
  }
}

function getInvite (key, data, callback) {
  var result = getRoot(data, (root) => {
    var invites = root['invites'] || {}
    var invite = invites[key]
    if (!invite) return false
    callback(null, invite)
    return true
  })
  if (!result) callback(new Error(`Missing invite: ${key}`))
}

function getReply (key, data, callback) {
  var result = getRoot(data, (root) => {
    var replies = root['replies'] || {}
    var reply = replies[key]
    if (!reply) return false
    callback(null, reply)
    return true
  })
  if (!result) return callback(new Error(`Missing reply: ${key}`))
}

function invitedByRoot (key, data, callback) {
  byRoot(key, 'invites', data, (err,  invites) => {
    if (err) return callback(err)
    var recps = Object.values(invites)
      .map(getContent)
      .map(content => content.recps)
      .reduce((acc, recp) => acc.concat(recp), [])
    var invited = Array.from(new Set(recps))
    return callback(null, invited)
  })
}

function byRoot (key, type, data, callback) {
  var collection = data[key]
  if (!collection) return callback(new Error(`Missing: ${key}`))
  return callback(null, collection[type])
}

function handleInviteMessage (accumulator, msg) {
  const content = getContent(msg)
  const id = msg.key
  const root = content.root

  var rootData = accumulator[root] || {}
  var invites = rootData['invites'] || {}
  invites[id] = msg
  rootData['invites'] = invites
  accumulator[root] = rootData
}

function handleReplyMessage (accumulator, msg) {
  const content = getContent(msg)
  const id = msg.key
  const root = content.root
  const branch = content.branch

  var rootData = accumulator[root] || {}
  var invites = rootData['invites'] || {}

  var invite = invites[branch]
  if (!invite) return

  var replies = invite['replies'] || {}
  replies[id] = msg
  invite['replies'] = replies

  clone = JSON.parse(JSON.stringify(invite))
  delete clone.replies
  msg['invite'] = clone
  replies[id] = msg
  rootData['replies'] = replies

  invites[branch] = invite
  rootData['invites'] = invites
  accumulator[root] = rootData
}

function isSchema (msg) {
  if (isInvite(msg)) return true
  else {
    delete msg.errors
    return isReply(msg)
  }
}

function flumeReduceFunction (accumulator, msg) {
  const content = getContent(msg)
  if (content.type === 'invite') {
    handleInviteMessage(accumulator, msg)
  } else if (content.type === 'invite-reply') {
    handleReplyMessage(accumulator, msg)
  }

  return accumulator
}

function flumeMapFunction (msg) {
  if (isSchema(msg)) return msg
}

function flumeAccumulatorInitialState () {
  return {}
}
