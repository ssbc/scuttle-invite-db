# ssb-invites-db

A flumeview-reduce using [scuttle-invite-schema](https://github.com/kgibb8/scuttle-invite-schema) for [scuttle-invite](https://github.com/kgibb8/scuttle-invite) ssb plugin. Allows for a polymorphic invitation/reply system to be used on-top of a `root ` record, such as a [Gathering](http://github.com/ssbc/patch-gathering).

```
// Plug into a Scuttlebot server
Server.use(require('ssb-invites-db'))

// Initialise a server
var server = Server()

// Now call the API
server.invites
```

Opens up a set of lenses on the reduced data structure:
## API
```js
{
  getInvite: 'async',
  getReply: 'async',
  invitesByRoot: 'async',
  replysByRoot: 'async'
  invitedByRoot: 'async'
}
```

## Data Template
```js
{
  '%fAVwnIMv2ikGDNRxT8lNpzZSXHyrLJ5l38kl8ZJVBww=.sha256': {
    invites: {
      '%OuJYS+oDoyLwuMdTWPk9A39JRu1D//PfD5jzzMkgX6Y=.sha256': {
        key:'%OuJYS+oDoyLwuMdTWPk9A39JRu1D//PfD5jzzMkgX6Y=.sha256',
        value: {
          author: '@cl1oUz84kJiHKttQiS87cHPEaiGv5I2lJPCfE9fy0fs=.ed25519',
          content: {
            type: 'invite',
            version: 'v1',
            root: '%fAVwnIMv2ikGDNRxT8lNpzZSXHyrLJ5l38kl8ZJVBww=.sha256'
            body: "Yo @Derek, want to come over for some snackage?"
            mentions: [Array],
            recps: [Array],
            accepted: true
          }
        }
        timestamp: 1528703315721,
        replys: {
          // Here's Derek's first reply
          '%Y4dJrHsmySSawl8WPk9A39JRiG4dK5LfDTT5jjMkgX6Y=.sha256': {
            key: '%Y4dJrHsmySSawl8WPk9A39JRiG4dK5LfDTT5jjMkgX6Y=.sha256',
            value: {
              author: '@FMM+LUXFosOUtWm2cGHu5ptzgsxEtV6l9NImuL8ggYQ=.ed25519',
              content: {
                type: 'invite-reply',
                version: 'v1',
                body: "Thanks @Holga but I can't make it",
                accepted: false,
                mentions: [Array],
                recps: [Array]
              }
            }
            timestamp: 1528703315721,
            invite: [Circular]
          },
          // Derek changes his mind...
          '%SBwACwsjh9QY4/jsClOI0dSiQSAUrWiiDoTW7CEggSE=.sha256': {
            key: '%SBwACwsjh9QY4/jsClOI0dSiQSAUrWiiDoTW7CEggSE=.sha256',
            value: {
            author: '@FMM+LUXFosOUtWm2cGHu5ptzgsxEtV6l9NImuL8ggYQ=.ed25519',
              content: {
                type: 'invite-reply',
                version: 'v1',
                body: "Scratch that, lets jam"
                accepted: true,
                recps: [Array]
              }
            }
            timestamp: 1528703315744,
            invite: [Circular]
          }
        },
      },
      '%to8Sb7bS2icz34sOuvkLmvuKcE/j5kGS7HrO+/c/pp0=.sha256': {
        key: '%to8Sb7bS2icz34sOuvkLmvuKcE/j5kGS7HrO+/c/pp0=.sha256',
        value: {
          author: '@cl1oUz84kJiHKttQiS87cHPEaiGv5I2lJPCfE9fy0fs=.ed25519',
          content: {
            body: "Grace, come eat some tasty grub at yard"
            recps: [Array]
          }
        }
        // Grace hasn't responded yet...
      }
    }
  },
  replys: {
    '%Y4dJrHsmySSawl8WPk9A39JRiG4dK5LfDTT5jjMkgX6Y=.sha256': {
      key: '%Y4dJrHsmySSawl8WPk9A39JRiG4dK5LfDTT5jjMkgX6Y=.sha256',
      value: {
        author: '@FMM+LUXFosOUtWm2cGHu5ptzgsxEtV6l9NImuL8ggYQ=.ed25519',
        content: {
          type: 'invite-reply',
          version: 'v1',
          body: "Thanks @Holga but I can't make it",
          accepted: false,
          mentions: [Array],
          recps: [Array]
        }
      }
      timestamp: 1528703315721,
    },
    '%Y4dJrHsmySSawl8WPk9A39JRiG4dK5LfDTT5jjMkgX6Y=.sha256': {
      key: '%Y4dJrHsmySSawl8WPk9A39JRiG4dK5LfDTT5jjMkgX6Y=.sha256',
      value: {
        author: '@FMM+LUXFosOUtWm2cGHu5ptzgsxEtV6l9NImuL8ggYQ=.ed25519',
        content: {
          type: 'invite-reply',
          version: 'v1',
          body: "Thanks @Holga but I can't make it",
          accepted: false,
          mentions: [Array],
          recps: [Array]
        }
      }
      timestamp: 1528703315721,
      invite: {
        key:'%OuJYS+oDoyLwuMdTWPk9A39JRu1D//PfD5jzzMkgX6Y=.sha256',
        value: {
          author: '@cl1oUz84kJiHKttQiS87cHPEaiGv5I2lJPCfE9fy0fs=.ed25519',
          content: {
            type: 'invite',
            version: 'v1',
            root: '%fAVwnIMv2ikGDNRxT8lNpzZSXHyrLJ5l38kl8ZJVBww=.sha256'
            body: "Yo @Derek, want to come over for some snackage?"
            mentions: [Array],
            recps: [Array],
            accepted: true
          }
        }
        timestamp: 1528703315721,
        replys: [Circular]
      }
    },
    '%SBwACwsjh9QY4/jsClOI0dSiQSAUrWiiDoTW7CEggSE=.sha256': {
      key: '%SBwACwsjh9QY4/jsClOI0dSiQSAUrWiiDoTW7CEggSE=.sha256',
      value: {
      author: '@FMM+LUXFosOUtWm2cGHu5ptzgsxEtV6l9NImuL8ggYQ=.ed25519',
        content: {
          type: 'invite-reply',
          version: 'v1',
          body: "Scratch that, lets jam"
          accepted: true,
          recps: [Array]
        }
      }
      timestamp: 1528703315744,
      invite: {
        key:'%OuJYS+oDoyLwuMdTWPk9A39JRu1D//PfD5jzzMkgX6Y=.sha256',
        value: {
          author: '@cl1oUz84kJiHKttQiS87cHPEaiGv5I2lJPCfE9fy0fs=.ed25519',
          content: {
            type: 'invite',
            version: 'v1',
            root: '%fAVwnIMv2ikGDNRxT8lNpzZSXHyrLJ5l38kl8ZJVBww=.sha256'
            body: "Yo @Derek, want to come over for some snackage?"
            mentions: [Array],
            recps: [Array],
            accepted: true
          }
        }
        timestamp: 1528703315721,
        replys: [Circular]
      }
    }
  }
}
```

This data structure allows the developer to access a set of invites based on its `root` record, be that an event, a group, a cabal... and render them and their invites / replys appropriately.

## TODO / THINK
* What `source` should look like for using pull-stream, or should we use [ssb-backlinks](http://github.com/ssbc/ssb-backlinks)?
