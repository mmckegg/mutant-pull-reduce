require('setimmediate')

var test = require('tape')
var MutantPullReduce = require('../index')
var watch = require('mutant/watch')
var onceTrue = require('mutant/once-true')
var computed = require('mutant/computed')
var pull = require('pull-stream')

var testStreamValues = [{
  "val": "first",
  sequenceNumber: 1
}, {
  "val": "second",
  sequenceNumber: 2
}, {
  "val": "third",
  sequenceNumber: 3
}, {
  "val": "fourth",
  sequenceNumber: 4
}];

var testStream = pull.values(testStreamValues);

test('A stream is completed in the same order', function(t) {
  var testStream = pull.values(testStreamValues);

  var mpr = MutantPullReduce(() => testStream, (state, item) => {
    state.push(item);
    return state;
  }, {
    startValue: []
  })

  var startValue = mpr();

  t.deepEquals(startValue, [], "Expect the start value to be respected.");

  mpr(v => {})

  var endValue = mpr();
  t.deepEquals(endValue, testStreamValues, "When just collecting the values from the stream, expect the ordering to be the same.")

  t.end();

})


test('A pull-stream can be resumed.', function(t) {
  var timesStart = 0;
  var timesResume = 0;

  var getStream = (latest) => {

    if (!latest) {
      timesStart = timesStart + 1
      return testStream
    } else {
      timesResume = timesResume + 1
      var latestSequence = latest.sequenceNumber;
      return pull(testStream, pull.filter(item => item.sequenceNumber > latestSequence))
    }
  }

  var reducer = (latestValue, item) => item;

  var observable = MutantPullReduce(getStream, reducer, {
    startValue: 0,
    nextTick: true
  });

  var unsubscribe = observable((value) => {
    if (value.sequenceNumber === 2) {
      t.comment("unsubbing.")
      test.unsubscribe()
    }
  });

  t.deepEquals(observable() , testStreamValues[1], "Expect the stream to stop after all ununsubscriptions.")
  t.deepEquals(timesStart, 1, "Expect the 'start stream' to only be invoked once.");
  t.deepEquals(timesResume, 0, "Expect the 'resume stream' path to not be invoked yet.");

  var subscribeRest = observable(
    (value) => {
      // noop
    }
  );

  t.deepEquals(observable() , testStreamValues[3], "Expect the end of the stream to be reached after re-subscribing")

  t.deepEquals(timesStart, 1, "Expect 'start stream' to have only been invoked once after re-subscribing");
  t.deepEquals(timesResume, 1, "Expect 'resume stream' to have been invoked after re-subscribing");

  t.end();

})
