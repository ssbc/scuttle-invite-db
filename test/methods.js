function PublishGathering (server) {
  return function publishGathering (params = {}, cb) {
    if (typeof params === 'function') return publishGathering({ type: 'gathering' }, params)
    server.publish(params, cb)
  }
}

function Server () {
  return require('scuttle-testbot')
    .use(require('../index'))
    .call()
}

module.exports = {
  PublishGathering,
  Server
}
