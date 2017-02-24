var pullPause = require('pull-pause')
var Value = require('mutant/value')
var computed = require('mutant/computed')
var LazyWatcher = require('mutant/lib/lazy-watcher')

var pull = require('pull-stream')

module.exports = function (stream, reducer, opts) {
  var pauser = pullPause((paused) => {})
  var seq = 0
  var lastSeq = -1
  pauser.pause()

  var binder = LazyWatcher(update, pauser.resume, pauser.pause)
  var result = function MutantPullReduce (listener) {
    if (!listener) {
      return binder.getValue()
    }
    return binder.addListener(listener)
  }

  binder.value = opts.startValue
  binder.nextTick = opts.nextTick
  var sync = Value(false)
  result.sync = computed([sync, result], (v) => v)

  result.push = function (item) {
    // allow manual pushing in of items
    seq += 1
    binder.value = reducer(binder.value, item)
    binder.onUpdate()
  }

  pull(
    stream,
    pauser,
    pull.drain((item) => {
      if (item.sync) {
        sync.set(true)
      } else {
        result.push(item)
      }
    }, () => {
      sync.set(true)
    })
  )

  return result

  // scoped

  function update () {
    if (!binder.live) {
      // attempt to push through sync changes
      pauser.resume()
      pauser.pause()
    }

    if (lastSeq !== seq) {
      seq = lastSeq
      return true
    }
  }
}
