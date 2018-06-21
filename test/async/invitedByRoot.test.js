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

    publishGathering = PublishGathering(grace)
  })

  context.afterEach(c => {
    server.close()
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
            var [ one, two, three, four, five ] = msgs

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
})
