const describe = require('tape-plus').describe
const pull = require('pull-stream')

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
      body: `invitation or reply message`,
      recps: [grace.id, frank.id]
    }
  })

  context.afterEach(c => {
    server.close()
  })

  context("Returns the correct invite message", (assert, next) => {
    pull(
      pull.values([
        { type: 'gathering', body: "1" },
        { type: 'gathering', body: "1" }
      ]),
      pull.asyncMap(grace.publish),
      pull.collect((err, gatherings) => {
        var [ first, second ] = gatherings

        pull(
          pull.values([
            Object.assign({}, baseParams, { type: 'invite', root: second.key, body: "1" }),
            Object.assign({}, baseParams, { type: 'invite', root: first.key, body: "2" }),
            Object.assign({}, baseParams, { type: 'invite', root: second.key, body: "3" }),
            Object.assign({}, baseParams, { type: 'invite', root: first.key, body: "4" }),
            Object.assign({}, baseParams, { type: 'invite', root: second.key, body: "5" })
          ]),
          pull.asyncMap(grace.publish),
          pull.collect((err, msgs) => {
            var [ one, two, three, four, five ] = msgs

            server.invites.getInvite(three.key, (err, data) => {
              assert.deepEqual(three, data, "Success")
              assert.notOk(err, "Errors are null")
              next()
            })
          })
        )
      })
    )
  })

  context("Returns attached replys", (assert, next) => {
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
          server.invites.getInvite(invite.key, (err, data) => {
            cloneInvite = JSON.parse(JSON.stringify(invite))
            delete cloneInvite.replys
            reply['invite'] = cloneInvite
            invite['replies'] = {}
            invite['replies'][reply.key] = reply
            assert.deepEqual(invite, data)
            next()
          })
        })
      })
    })
  })
})

