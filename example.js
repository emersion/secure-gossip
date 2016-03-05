var Gossip = require('./gossip')

var peer1 = Gossip()
var peer2 = Gossip()
var peer3 = Gossip()

var p1 = peer1.createPeerStream()
var p2 = peer2.createPeerStream()
var p3 = peer3.createPeerStream()

p1.pipe(p2).pipe(p1)
p1.pipe(p3).pipe(p1)

var msg = {
  data: 'hello warld'
}

peer3.publish(msg)

peer1.on('message', function (msg) {
  console.log('p1 message', msg)
})

peer2.on('message', function (msg) {
  console.log('p2 message', msg)
})

peer3.on('message', function (msg) {
  console.log('p3 message', msg)
})
