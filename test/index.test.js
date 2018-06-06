const Server = require('scuttle-testbot')
const test = require('tape')
const pull = require('pull-stream')
const { isResponse } = require('ssb-invites-schema')

Server
  .use(require('../index.js'))

const server = Server()

var grace = server.createFeed()
var frank = server.createFeed()

test("grace invites frank to an event", assert => {
  assert.plan(1)

  createEvent((err, event) => {
    createInvite(event, (err, invite) => {
      server.invites.find(invite.key, (err, inv) => {
        find = {
          id: invite.key,
          body: invite.value.content.body,
          recipient: frank.id
        }
        assert.deepEqual(inv, find)
        server.close()
      })
    })
  })
})

test("frank responds to grace's invite", assert => {
  assert.plan(1)

  createEvent((err, event) => {
    createInvite(event, (err, invite) => {
      createResponse(event, invite, (err, response) => {
        server.invites.find(invite.key, (err, inv) => {
          find = {
            id: invite.key,
            body: invite.value.content.body,
            recipient: frank.id,
            accepted: true
          }
          assert.deepEqual(inv, find)
          server.close()
        })
      })
    })
  })
})

function createEvent (cb) {
  grace.publish({
    type: 'event',
    title: 'Magical Mystery Tour',
    body: 'come to an awesome mushroom workshop, where we drink magic potion and talk about toadstools'
  }, cb)
}

function createInvite (event, cb) {
  grace.publish({
    type: 'invite',
    module: 'events',
    version: 'v1',
    root: event.key,
    body: `hey @frank, do you want to come to my super mushroom workshop [Magical Mystery Tour](${event.key})?`,
    recps: [grace.id, frank.id],
    mentions: [
      { link: event.key },
      { link: frank.id, name: 'frank' }
    ]
  }, cb)
}

function createResponse (event, invite, cb) {
  var stuff = {
    type: 'response',
    version: 'v1',
    root: event.key,
    branch: invite.key,
    body: `Yessum`,
    accept: true,
    recps: [grace.id, frank.id]
  }
  console.log(isResponse(stuff))
  frank.publish(stuff, cb)
}
