const describe = require('tape-plus').describe

const { PublishGathering, Server } = require('../methods.js')

describe("invites.getReply", context => {
  let grace, frank
  let publishGathering
  let params

  context.beforeEach(c => {
    server = Server()
    grace = server.createFeed()
    frank = server.createFeed()

    publishGathering = PublishGathering(grace)

    params = {
      version: 'v1',
      body: `invitation or reply message`,
      recps: [grace.id, frank.id]
    }
  })

  context.afterEach(c => {
    server.close()
  })

  context("Without an invite", (assert, next) => {
    publishGathering((err, gathering) => {
      params = Object.assign({}, baseParams, {
        type: 'invite-reply',
        root: gathering.key
      })
      grace.publish(params, (err, reply) => {
        server.invites.getReply(reply.key, (err, data) => {
          assert.ok(err)
          assert.equal(err.message, `Missing reply: ${reply.key}`)
          next()
        })
      })
    })
  })

  context("Returns reply with attached invites", (assert, next) => {
    publishGathering((err, gathering) => {
      params = Object.assign({}, baseParams, {
        type: 'invite',
        root: gathering.key
      })
      grace.publish(params, (err, invite) => {
        params = Object.assign({}, baseParams, {
          type: 'invite-reply',
          root: gathering.key,
          branch: invite.key,
          accept: true
        })
        frank.publish(params, (err, reply) => {
          server.invites.getReply(reply.key, (err, data) => {
            reply['invite'] = invite
            assert.deepEqual(reply, data)
            next()
          })
        })
      })
    })
  })
})
