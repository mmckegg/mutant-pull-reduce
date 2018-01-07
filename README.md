mutant-pull-reduce
===

Reduce the output of a [pull-stream](https://github.com/pull-stream/pull-stream) into a [mutant](https://github.com/mmckegg/mutant) observable.

## Install

```shell
$ npm install mutant-pull-reduce --save
```

## API

```
var pullReduce = require('mutant-pull-reduce')
```

### `pullReduce(getStream, reducer, opts)`

**`getStream(lastValue)`:** A function that returns a `source` or `through` [pull-stream](https://github.com/pull-stream/pull-stream) to suck data from when the observable is subscribed to for the first time (or resumed later after all the previous subscribers unsubscribed).

The getStream function should accept an argument that is the latest value in the stream (or null if the stream has not began.) It is invoked to get the stream to reduce when:
* The observable is subscribed to for the first time.
* The observable is re-subscribed to after all subscribers have previously unsubscribed.

The getStream function should use the latest value to resume the stream from it's last position (or from the start if the argument is null.)

E.g.:

```
function getStream (lastItem) {
  if (lastItem) {
    // resume (with some gt/lt option)
    // or if return nothing, then reducer doesn't resume
  } else {
    // stream from start
  }
}
```

**`reducer(lastValue, item)`**: expects the new value to be returned

**`opts`**:
 - startValue
 - nextTick
