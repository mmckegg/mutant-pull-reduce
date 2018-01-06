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

  t.deepEquals(startValue, []);

  mpr(v => {})

  var endValue = mpr();
  t.deepEquals(endValue, testStreamValues)

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
    startValue: 0
  });

  let unsubscribe = observable((value) => {
    if (value.sequenceNumber === 2) {
      unsubscribe()
    }
  });

  t.deepEquals(observable() , testStreamValues[1])
  t.deepEquals(timesStart, 1);
  t.deepEquals(timesResume, 0);

  var subscribeRest = observable(
    (value) => {
      // noop
    }
  );

  t.deepEquals(observable() , testStreamValues[3])

  t.deepEquals(timesStart, 1);
  t.deepEquals(timesResume, 1);

  t.end();

})
