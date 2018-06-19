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
      ))

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
  rootData['responses'] = responses
  invite['responses'] = responses
  invites[branch] = invite
  rootData['invites'] = invites
  accumulator[root] = rootData
}

function isSchema (msg) {
  return isInvite(msg) || isResponse(msg)
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
