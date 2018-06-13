const Server = require('scuttle-testbot')
const test = require('tape')
const pull = require('pull-stream')

const Helper = require('./test.helper.js')

test("grace invites frank to an event", assert => {
  assert.plan(1)

  Server.use(require('../index.js'))

  const server = Server()

  var { grace, frank, createEvent, createInvite, createResponse } = Helper(server)

  createEvent((err, event) => {
    createInvite(event, (err, invite) => {
      server.invites.find(invite.key, (err, inv) => {
        var { body, mentions } = invite.value.content
        var data = {
          author: grace.id,
          recipient: frank.id,
          body,
          mentions
        }
        assert.deepEqual(inv, data)
        server.close()
      })
    })
  })
})

test("grace invites frank to an event twice", assert => {
  assert.plan(1)

  Server.use(require('../index.js'))

  const server = Server()

  var { grace, frank, createEvent, createInvite, createResponse } = Helper(server)

  createEvent((err, event) => {
    createInvite(event, (err, first) => {
      createInvite(event, (err, second) => {
        assert.ok()
        server.close()
      })
    })
  })
})

test("frank responds to grace's invite", assert => {
  assert.plan(1)

  Server.use(require('../index.js'))

  const server = Server()

  var { grace, frank, createEvent, createInvite, createResponse } = Helper(server)

  createEvent((err, event) => {
    createInvite(event, (err, invite) => {
      createResponse(event, invite, (err, response) => {
        server.invites.find(invite.key, (err, inv) => {
          var { author, content } = response.value
          var { body, mentions, accept } = content
          var responseData = {}
          responseData[response.key] = {
            author,
            body,
            accepted: accept,
            timestamp: response.timestamp
          }
          var data = {
            author: grace.id,
            recipient: frank.id,
            body: invite.value.content.body,
            mentions: invite.value.content.mentions,
            responses: responseData,
            accepted: accept
          }
          assert.deepEqual(inv, data)
          server.close()
        })
      })
    })
  })
})

test("frank changes his mind and responds differently, gives most up to date state of invite", assert => {
  assert.plan(1)

  Server.use(require('../index.js'))

  const server = Server()

  var { grace, frank, createEvent, createInvite, createResponse } = Helper(server)

  createEvent((err, event) => {
    createInvite(event, (err, invite) => {
      createResponse(event, invite, (err, response) => {
        server.invites.find(invite.key, (err, inv) => {
          assert.ok()
          server.close()
        })
      })
    })
  })
})

test('stream source', assert => {
  assert.plan(1)

  Server.use(require('../index.js'))

  const server = Server()

  var { grace, frank, createEvent, createInvite, createResponse } = Helper(server)

  createEvent((err, event) => {
    createInvite(event, (err, invite) => {
      createResponse(event, invite, (err, response) => {
        pull(
          server.invites.stream(),
          pull.collect((err, msgs) => {
            var { author, content } = response.value
            var { body, accept } = content
            var responses = {}
            responses[response.key] = {
              author,
              body,
              accepted: accept,
              timestamp: response.timestamp
            }
            var { body, mentions } = invite.value.content
            var invites = {}
            invites[invite.key] = {
              author: grace.id,
              recipient: frank.id,
              body,
              mentions,
              responses,
              accepted: accept
            }

            assert.deepEqual([{ root: event.key, invites, responses }], msgs)
            server.close()
          })
        )
      })
    })
  })
})
