const describe = require('tape-plus').describe

const { PublishGathering, Server } = require('../methods.js')

describe("invites.getInvite", context => {
  let grace, frank
  let publishGathering, publishInvite, publishReply
  let params

  context.beforeEach(c => {
    server = Server()
    grace = server.createFeed()
    frank = server.createFeed()

    publishGathering = PublishGathering(grace)

    baseParams = {
      version: 'v1',
      body: `invitation or response message`,
      recps: [grace.id, frank.id]
    }
  })

  context.afterEach(c => {
    server.close()
  })

  context("Returns an invite message", (assert, next) => {
    publishGathering((err, gathering) => {
      params = Object.assign({}, baseParams, {
        type: 'invite',
        root: gathering.key
      })
      grace.publish(params, (err, invite) => {
        server.invites.getInvite(invite.key, (err, data) => {
          assert.deepEqual(invite, data, "Success")
          assert.notOk(err, "Errors are null")
          next()
        })
      })
    })
  })

  context("Returns attached responses", (assert, next) => {
    publishGathering((err, gathering) => {
      params = Object.assign({}, baseParams, {
        type: 'invite',
        root: gathering.key
      })
      grace.publish(params, (err, invite) => {
        params = Object.assign({}, baseParams, {
          type: 'response',
          root: gathering.key,
          branch: invite.key,
          accept: true
        })
        frank.publish(params, (err, response) => {
          server.invites.getInvite(invite.key, (err, data) => {
            cloneInvite = JSON.parse(JSON.stringify(invite))
            delete cloneInvite.responses
            response['invite'] = cloneInvite
            invite['responses'] = {}
            invite['responses'][response.key] = response
            assert.deepEqual(invite, data)
            next()
          })
        })
      })
    })
  })
})

