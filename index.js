var Aborter = require('pull-abortable')
var Value = require('mutant/value')
var computed = require('mutant/computed')
var LazyWatcher = require('mutant/lib/lazy-watcher')

var pull = require('pull-stream')

/**
 * @getStream is a function that accepts an argument that is the latest value
 * in the stream (or null if the stream has not began.) It is invoked to get
 * the stream to reduce when:
 *    * The observable is subscribed to for the first time.
 *    * The observable is re-subscribed to after all subscribers have unsubscribed.
 * The getStream function should use the latest value to resume the stream from it's
 * last position (or from the start if the argument is null.)
 * @reducer reducer(lastValue, item)`**: expects the new value to be returned
 * @opts The options (startValue, nextTick)
 */
module.exports = function (getStream, reducer, opts) {
  var aborter = Aborter((aborted) => {})
  var seq = 0
  var lastSeq = -1

  var binder = LazyWatcher(update, startStream, aborter.abort)
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

  return result

  /**
   * Start or resume the stream from the last value using the user supplied function.
   */
  function startStream() {
    pull(
      getStream(binder.value),
      aborter,
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
  }

  // scoped

  function update () {

    if (lastSeq !== seq) {
      seq = lastSeq
      return true
    }
  }
}
