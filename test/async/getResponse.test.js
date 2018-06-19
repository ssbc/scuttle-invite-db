const describe = require('tape-plus').describe

const { PublishGathering, Server } = require('../methods.js')

describe("invites.getResponse", context => {
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
      body: `invitation or response message`,
      recps: [grace.id, frank.id]
    }
  })

  context.afterEach(c => {
    server.close()
  })

  context("Without an invite", (assert, next) => {
    publishGathering((err, gathering) => {
      params = Object.assign({}, baseParams, {
        type: 'response',
        root: gathering.key
      })
      grace.publish(params, (err, response) => {
        server.invites.getResponse(response.key, (err, data) => {
          assert.ok(err)
          assert.equal(err.message, "no response with that key")
          next()
        })
      })
    })
  })

  context("Returns response with attached invites", (assert, next) => {
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
          server.invites.getResponse(response.key, (err, data) => {
            response['invite'] = invite
            assert.deepEqual(response, data)
            next()
          })
        })
      })
    })
  })
})
