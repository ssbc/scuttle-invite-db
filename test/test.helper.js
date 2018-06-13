module.exports = Helper

function Helper (server) {
  var grace = server.createFeed()
  var frank = server.createFeed()

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
    frank.publish({
      type: 'response',
      version: 'v1',
      root: event.key,
      branch: invite.key,
      body: `Yessum`,
      accept: true,
      recps: [grace.id, frank.id]
    }, cb)
  }

  return {
    grace,
    frank,
    createEvent,
    createInvite,
    createResponse
  }
}
