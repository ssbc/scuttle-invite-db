# ssb-invites-db

A flumeview-reduce using [ssb-invites-schema](https://github.com/kgibb8/ssb-invites-schema) for [scuttle-invite](https://github.com/kgibb8/scuttle-invite) ssb plugin.

## API
```
find: 'async'
all: 'async'
stream: 'source'
```

## Data Template
```js
{
  '%fAVwnIMv2ikGDNRxT8lNpzZSXHyrLJ5l38kl8ZJVBww=.sha256': {
    invites: {
      '%OuJYS+oDoyLwuMdTWPk9A39JRu1D//PfD5jzzMkgX6Y=.sha256': {
        author: '@cl1oUz84kJiHKttQiS87cHPEaiGv5I2lJPCfE9fy0fs=.ed25519',
        recipient: '@FMM+LUXFosOUtWm2cGHu5ptzgsxEtV6l9NImuL8ggYQ=.ed25519',
        body: "Yo @Derek, want to come over for some snackage?"
        mentions: [Array],
        responses: {
          // Here's Derek's first response
          '%Y4dJrHsmySSawl8WPk9A39JRiG4dK5LfDTT5jjMkgX6Y=.sha256': {
            body: "Thanks @Holga but I can't make it",
            accepted: false,
            mentions: [Array],
            timestamp: 1528703315721
          },
          // Derek changes his mind...
          '%SBwACwsjh9QY4/jsClOI0dSiQSAUrWiiDoTW7CEggSE=.sha256': {
            body: "Scratch that, lets jam"
            accepted: true,
            timestamp: 1528703315744
          }
        },
        accepted: true // This is the sum of this invite's response history using timestamp
      },
      '%to8Sb7bS2icz34sOuvkLmvuKcE/j5kGS7HrO+/c/pp0=.sha256': {
        author: '@cl1oUz84kJiHKttQiS87cHPEaiGv5I2lJPCfE9fy0fs=.ed25519',
        recipient: '@sj6xime3w8ASbRQx7aVlpvRFk6H+kYwuBqPzeLWpA3Q=.ed25519',
        body: "Grace, come eat some tasty grub at yard"
        // Grace hasn't responded yet...
      }
    }
  },
  responses: {
    '%Y4dJrHsmySSawl8WPk9A39JRiG4dK5LfDTT5jjMkgX6Y=.sha256': {
      body: "Thanks @Holga but I can't make it",
      accepted: false,
      mentions: [Array],
      timestamp: 1528703315721,
      invite: {
        id: '%OuJYS+oDoyLwuMdTWPk9A39JRu1D//PfD5jzzMkgX6Y=.sha256'
        author: '@cl1oUz84kJiHKttQiS87cHPEaiGv5I2lJPCfE9fy0fs=.ed25519',
        recipient: '@FMM+LUXFosOUtWm2cGHu5ptzgsxEtV6l9NImuL8ggYQ=.ed25519',
        body: "Yo @Derek, want to come over for some snackage?"
      }
    },
    '%SBwACwsjh9QY4/jsClOI0dSiQSAUrWiiDoTW7CEggSE=.sha256': {
      body: "Scratch that, lets jam",
      accepted: true,
      timestamp: 1528703315744,
      invite: {
        id: '%OuJYS+oDoyLwuMdTWPk9A39JRu1D//PfD5jzzMkgX6Y=.sha256'
        author: '@cl1oUz84kJiHKttQiS87cHPEaiGv5I2lJPCfE9fy0fs=.ed25519',
        recipient: '@FMM+LUXFosOUtWm2cGHu5ptzgsxEtV6l9NImuL8ggYQ=.ed25519',
        body: "Yo @Derek, want to come over for some snackage?"
      }
    }
  }
}
```

This data structure allows the developer to access a set of invites based on its `root` record, be that an event, a group, a cabal... and render them and their invites / responses appropriately.

## TODO / THINK
* Think about how to render the invites and their responses, what different perspectives / lenses on the data would be useful?
* If a response is amended, should it store its 'branch' response?
* `stream` currently data structure is slightly different to enable it to be iterable. Should they be standardised? If so it means changing the conventional structure from an object to array, which could be slower to access... find out!
