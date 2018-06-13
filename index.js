const flumeView = require('flumeview-reduce')
const defer = require('pull-defer')
const iterable = require('pull-iterable')

const { parseInvite, parseResponse } = require('ssb-invites-schema')

const FLUME_VIEW_VERSION = 1.0
const FLUME_VIEW_NAME = "invites"

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
        flumeAccumulatorInitialState()
      )
    )

    return {
      all: view.get,
      find: (id, cb) => withView(view, cb, findInvites.bind(null, id)),
      stream: () => {
        var source = defer.source()
        view.get((err, data) => {
          if (err) source.abort(err)
          else {
            var mapped = Object.keys(data).map(root => {
              var { invites, responses } = data[root]
              return { root, invites, responses }
            })
            source.resolve(iterable(mapped))
          }
        })
        return source
      }
    }
  }
}

// Credit to Happy0! This is super neat way of drying up code
function withView (view, cb, fn) {
  view.get((err, data) => {
    if (err) return cb(err)
    cb(null, fn(data))
  })
}

function findInvites (key, data) {
  for(var k in data) {
    var root = data[k]
    if (!root) continue
    var invites = root['invites']
    var invite = invites[key]
    if (!invite) continue
    else return invite
  }
  return null
}

function handleInviteMessage (accumulator, invite) {
  const {
    id,
    author,
    recipient,
    root,
    body,
    mentions,
    timestamp
  } = invite

  var rootData = accumulator[root] || {}
  var invites = rootData['invites'] || {}
  invites[id] = { author, recipient }
  if (mentions) invites[id]['mentions'] = mentions
  if (body) invites[id]['body'] = body
  rootData['invites'] = invites
  accumulator[root] = rootData
}

function handleResponseMessage (accumulator, response) {
  const {
    id,
    author,
    recipient,
    timestamp,
    root,
    branch,
    accept,
    body,
    mentions
  } = response

  var rootData = accumulator[root]
  var invites = rootData['invites']

  var invite = invites[branch]
  if (!invite) return

  var responseData = { author, accepted: accept }
  if (body) responseData['body'] = body
  if (mentions) responseData['mentions'] = mentions
  responseData['timestamp'] = timestamp
  var responses = invite['responses'] || {}
  responses[id] = responseData
  rootData['responses'] = responses
  invite['responses'] = responses
  invite['accepted'] = accept
  invites[branch] = invite
  rootData['invites'] = invites
  accumulator[root] = rootData
}

function parseWithSchema (msg) {
  return parseInvite(msg) || parseResponse(msg)
}

function flumeReduceFunction (accumulator, inviteOrResponse) {
  const { type } = inviteOrResponse
  if (type === 'invite') {
    handleInviteMessage(accumulator, inviteOrResponse)
  } else if (type === 'response') {
    handleResponseMessage(accumulator, inviteOrResponse)
  }

  return accumulator
}

function flumeMapFunction (msg) {
  var inviteOrResponse = parseWithSchema(msg)
  if (inviteOrResponse) {
    return inviteOrResponse
  }
}

function flumeAccumulatorInitialState () {
  return {}
}
