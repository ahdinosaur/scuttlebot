var tape    = require('tape')
var pull    = require('pull-stream')
var sbot    = require('../')
var ssbkeys = require('ssb-keys')

tape('follow, isFollowing, followedUsers, unfollow', function (t) {
  var u = require('./util')

  var dbAlice = u.createDB('followtest-alice')
  var alice = dbAlice.feed

  var dbBob = u.createDB('followtest-bob')
  var bob = dbBob.feed

  var db = u.createDB('feed-test', {port: 1234, host: 'localhost'})
  var feed = db.feed
  var server = db.use(require('../plugins/easy'))

  console.log(server.getManifest())

  var client = sbot.createClient(
    db.config,
    server.getManifest()
  )

  var signed = ssbkeys.signObj(feed.keys, {
    role: 'client',
    ts: Date.now(),
    public: feed.keys.public
  })

  client.auth(signed, function(err) {
    if (err) throw err

    client.easy.follow(bob.id, function(err, msg) {
      if (err) throw err

      client.easy.isFollowing(bob.id, function(err, isFollowing) {
        if (err) throw err
        t.equal(isFollowing, true)

        client.easy.isFollowing(alice.id, function(err, isFollowing) {
          if (err) throw err
          t.equal(isFollowing, false)

          pull(client.easy.followedUsers(), pull.collect(function(err, users) {
            if (err) throw err
            t.equal(users.length, 1)
            t.equal(users[0].toString('base64'), bob.id.toString('base64'))

            // client.unfollow(bob.id, function(err) {
            //   if (err) throw err

            //   client.isFollowing(bob.id, function(err, isFollowing) {
            //     if (err) throw err
            //     t.equal(isFollowing, false)

                client.close(function() {
                  t.end()
                  server.close()
                })
              // })
            // })
          }))
        })
      })
    })
  })
})
