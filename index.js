var debug = require('debug')('secure-gossip')
var ssbkeys = require('ssb-keys')
var Duplex = require('readable-stream').Duplex
var EventEmitter = require('events')
var util = require('util')

function Gossip (keys, opts) {
  if (!(this instanceof Gossip)) { return new Gossip(keys, opts) }

  if (!keys) { keys = ssbkeys.generate() }

  opts = opts || {}

  var interval = opts.interval || 100

  EventEmitter.call(this)

  this.keys = keys
  this.store = []
  this.peers = []
  this.seq = 0

  this.seqs = {}

  setInterval(this.gossip.bind(this), interval)
}

Gossip.prototype.createPeerStream = function () {
  var self = this

  var stream = new Duplex({

    objectMode: true,

    read: function (n) {
    },

    write: function (chunk, enc, next) {
      if (chunk.public === self.keys.public) {
        debug('got one of my own messages; discarding')
      } else if (ssbkeys.verifyObj(chunk, chunk)) {
        if (self.seqs[chunk.public] === undefined || self.seqs[chunk.public] < chunk.seq) {
          self.seqs[chunk.public] = chunk.seq
          self.store.push(chunk)
          debug('current seq for', chunk.public, 'is', self.seqs[chunk.public])
          self.emit('message', chunk.data)
        } else {
          debug('old gossip; discarding')
        }
      } else {
        debug('received message with bad signature! discarding')
      }
      next()
    }
  })

  this.peers.push(stream)

  return stream
}

Gossip.prototype.publish = function (msg) {
  msg.public = this.keys.public
  msg.seq = this.seq++
  msg = ssbkeys.signObj(this.keys, msg)

  this.store.push(msg)
}

Gossip.prototype.gossip = function () {
  for (var i = 0; i < this.peers.length; i++) {
    for (var j = 0; j < this.store.length; j++) {
      this.peers[i].push(this.store[j])
    }
  }

  this.store = []
}

util.inherits(Gossip, EventEmitter)

module.exports = Gossip
