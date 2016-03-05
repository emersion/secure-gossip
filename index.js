var debug = require('debug')('secure-gossip')
var ssbkeys = require('ssb-keys')
var Duplex = require('readable-stream').Duplex
var EventEmitter = require('events')
var util = require('util')

function clone (obj) {
  var _obj = {}
  for(var k in obj) {
    if(Object.hasOwnProperty.call(obj, k))
      _obj[k] = obj[k]
  }
  return _obj
}

function Gossip (opts) {
  if (!(this instanceof Gossip)) { return new Gossip(opts) }

  opts = opts || {}

  if (!opts.keys) { opts.keys = ssbkeys.generate() }

  var interval = opts.interval || 100

  EventEmitter.call(this)

  this.keys = opts.keys
  this.store = []
  this.peers = []
  this.seq = 0

  this.seqs = {}

  this.interval = interval === -1 ? null : setInterval(this.gossip.bind(this), interval)
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
      } else if (ssbkeys.verifyObj(chunk, chunk.data)) {
        if (self.seqs[chunk.public] === undefined || self.seqs[chunk.public] < chunk.seq) {
          self.seqs[chunk.public] = chunk.seq
          self.store.push(chunk)
          debug('current seq for', chunk.public, 'is', self.seqs[chunk.public])
          var copy = clone(chunk.data)
          delete copy.signature
          self.emit('message', copy)
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
  var data = msg
  msg = {
    data: ssbkeys.signObj(this.keys, data),
    public: this.keys.public,
    seq: this.seq++,
  }

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

Gossip.prototype.stop = function () {
  if (this.interval) {
    clearInterval(this.interval)
  }
}

util.inherits(Gossip, EventEmitter)

module.exports = Gossip
