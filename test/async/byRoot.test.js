const describe = require('tape-plus').describe
const pull = require('pull-stream')

const { PublishGathering, Server } = require('../methods.js')

describe("invites.byRoot", context => {
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

  context("invitesByRoot returns a collection of invites", (assert, next) => {
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

            server.invites.invitesByRoot(second.key, (err, data) => {
              var invites = msgs.reduce((state, msg) => {
                if (msg.value.content.root !== second.key) return state
                state[msg.key] = msg
                return state
              }, {})

              assert.deepEqual(invites, data, "Success")
              assert.notOk(err, "Errors are null")
              next()
            })
          })
        )
      })
    )
  })

  context("repliesByRoot returns a collection of replies", (assert, next) => {
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
            Object.assign({}, baseParams, { type: 'invite', root: first.key }),
            Object.assign({}, baseParams, { type: 'invite', root: second.key }),
            Object.assign({}, baseParams, { type: 'invite', root: first.key })
          ]),
          pull.asyncMap(grace.publish),
          pull.collect((err, collectedInvites) => {
            var [ uno, dos, tres ] = collectedInvites

            pull(
              pull.values([
                Object.assign({}, baseParams, { type: 'invite-reply', root: first.key, branch: uno.key, body: "1", accept: false }),
                Object.assign({}, baseParams, { type: 'invite-reply', root: second.key, branch: dos.key, body: "2", accept: true }),
                Object.assign({}, baseParams, { type: 'invite-reply', root: first.key, branch: tres.key, body: "3", accept: true }),
              ]),
              pull.asyncMap(frank.publish),
              pull.collect((err, collectedReplies) => {
                var [ one, two, three ] = collectedReplies

                server.invites.repliesByRoot(second.key, (err, data) => {
                  reply = {}
                  reply[two.key] = Object.assign(two, { invite: dos })
                  assert.deepEqual(reply, data, "Success")
                  assert.notOk(err, "Errors are null")
                  next()
                })
              })
            )
          })
        )
      })
    )
  })

  context("invitedByRoot returns a collection of feed IDs", (assert, next) => {
    pull(
      pull.values([ { type: 'gathering', body: "1" } ]),
      pull.asyncMap(grace.publish),
      pull.take(1),
      pull.drain(gathering => {

        adaLovelace = server.createFeed()
        kropotkin = server.createFeed()
        emmaGoldman = server.createFeed()

        baseParams = {
          version: 'v1',
          type: 'invite',
          root: gathering.key
        }

        pull(
          pull.values([
            Object.assign({}, baseParams, { recps: [adaLovelace.id, grace.id], body: "1" }),
            Object.assign({}, baseParams, { recps: [kropotkin.id, grace.id], body: "2" }),
            Object.assign({}, baseParams, { recps: [emmaGoldman.id, grace.id], body: "3" }),
            Object.assign({}, baseParams, { recps: [server.id, grace.id], body: "4" }),
          ]),
          pull.asyncMap(grace.publish),
          pull.collect((err, msgs) => {
            server.invites.invitedByRoot(gathering.key, (err, data) => {
              var recipients = [adaLovelace.id, kropotkin.id, emmaGoldman.id, server.id, grace.id].sort()
              assert.deepEqual(recipients, data.sort(), "Success")
              assert.notOk(err, "Errors are null")
              next()
            })
          })
        )
      })
    )
  })

  context("repliedByRoot returns a collection of feed IDs", (assert, next) => {
    pull(
      pull.values([ { type: 'gathering', body: "1" } ]),
      pull.asyncMap(server.publish),
      pull.take(1),
      pull.drain(gathering => {

        adaLovelace = server.createFeed()
        kropotkin = server.createFeed()
        emmaGoldman = server.createFeed()

        baseParams = {
          version: 'v1',
          root: gathering.key
        }

        pull(
          pull.values([
            Object.assign({}, baseParams, { type: 'invite', recps: [adaLovelace.id, server.id], body: "1" }),
            Object.assign({}, baseParams, { type: 'invite', recps: [kropotkin.id, server.id], body: "2" }),
            Object.assign({}, baseParams, { type: 'invite', recps: [emmaGoldman.id, server.id], body: "3" }),
            Object.assign({}, baseParams, { type: 'invite', recps: [server.id, server.id], body: "4" }),
          ]),
          pull.asyncMap(grace.publish),
          pull.collect((err, msgs) => {
            var [ one, two, three, four, five ] = msgs

            pull(
              pull.values([
                {
                  server: adaLovelace,
                  params: Object.assign({}, baseParams, {
                    type: 'invite-reply',
                    recps: [adaLovelace.id, server.id],
                    branch: one.key,
                    body: "1",
                    accept: true
                  })
                },
                {
                  server: kropotkin,
                  params: Object.assign({}, baseParams, {
                    type: 'invite-reply',
                    recps: [kropotkin.id, server.id],
                    branch: two.key,
                    body: "2",
                    accept: false
                  })
                }
              ]),
              pull.asyncMap((data, cb) => data.server.publish(data.params, cb)),
              pull.collect((err, msgs) => {

                server.invites.repliedByRoot(gathering.key, (err, data) => {
                  var recipients = [adaLovelace.id, kropotkin.id].sort()
                  assert.deepEqual(recipients, data.sort(), "Success")
                  assert.notOk(err, "Errors are null")
                  next()
                })
              })
            )
          })
        )
      })
    )
  })
})
