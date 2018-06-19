const flumeView = require('flumeview-reduce')
const defer = require('pull-defer')
const iterable = require('pull-iterable')

const getContent = require('ssb-msg-content')

const {
  isInvite,
  isResponse
} = require('ssb-invites-schema')


const FLUME_VIEW_VERSION = 1.0
const FLUME_VIEW_NAME = "invites"

module.exports = {
  name: FLUME_VIEW_NAME,
  version: require('./package.json').version,
  manifest: {
    getInvite: 'async',
    getResponse: 'async',
    // getInvitesByRoot: 'async',
    // getResponsesByRoot: 'async'
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
      getInvite: (id, cb) => withView(view, cb, getInvite.bind(null, id)),
      getResponse: (id, cb) => withView(view, cb, getResponse.bind(null, id)),
      // getInvitesByRoot: (root, cb) => withView(view, cb, getInvitesByRoot.bind(null, id)),
      // getResponsesByRoot: (root, cb) => withView(view, cb, getResponsesByRoot.bind(null, id)),
      // stream: () => {
      //   var source = defer.source()
      //   view.get((err, data) => {
      //     if (err) source.abort(err)
      //     else {
      //       var mapped = Object.keys(data).map(root => {
      //         var { invites, responses } = data[root]
      //         return { root, invites, responses }
      //       })
      //       source.resolve(iterable(mapped))
      //     }
      //   })
      //   return source
      // }
    }
  }
}

// Credit to Happy0! This is super neat way of drying up code
function withView (view, cb, fn) {
  view.get((err, data) => {
    if (err) return cb(err)
    fn(data, cb)
  })
}

function getInvite (key, data, cb) {
  for(var k in data) {
    var root = data[k]
    if (!root) continue
    var invites = root['invites'] || {}
    var invite = invites[key]
    if (!invite) continue
    else return cb(null, invite)
  }
  return cb(new Error('no invite with that key'))
}

function getResponse (key, data, cb) {
  for(var k in data) {
    var root = data[k]
    if (!root) continue
    var responses = root['responses'] || {}
    var response = responses[key]
    if (!response) continue
    else return cb(null, response)
  }
  return cb(new Error('no response with that key'))
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

function handleResponseMessage (accumulator, msg) {
  const content = getContent(msg)
  const id = msg.key
  const root = content.root
  const branch = content.branch

  var rootData = accumulator[root]
  var invites = rootData['invites']

  var invite = invites[branch]
  if (!invite) return

  var responses = invite['responses'] || {}
  responses[id] = msg
  invite['responses'] = responses

  cloneInvite = JSON.parse(JSON.stringify(invite))
  delete cloneInvite.responses
  msg['invite'] = cloneInvite
  responses[id] = msg
  rootData['responses'] = responses

  invites[branch] = invite
  rootData['invites'] = invites
  accumulator[root] = rootData
}

function isSchema (msg) {
  if (isInvite(msg)) return true
  else {
    delete msg.errors
    return isResponse(msg)
  }
}

function flumeReduceFunction (accumulator, msg) {
  const content = getContent(msg)
  if (content.type === 'invite') {
    handleInviteMessage(accumulator, msg)
  } else if (content.type === 'response') {
    handleResponseMessage(accumulator, msg)
  }

  return accumulator
}

function flumeMapFunction (msg) {
  if (isSchema(msg)) return msg
}

function flumeAccumulatorInitialState () {
  return {}
}
