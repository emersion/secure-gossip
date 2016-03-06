var Gossip = require('./index')

var peer1 = Gossip()
var peer2 = Gossip()
var peer3 = Gossip()

var p1 = peer1.createPeerStream()
var p2_1 = peer2.createPeerStream()
var p2_2 = peer2.createPeerStream()
var p3 = peer3.createPeerStream()

// 3 peers in a line, with peer-2 in the middle
p1.pipe(p2_1).pipe(p1)
p2_2.pipe(p3).pipe(p2_2)

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
