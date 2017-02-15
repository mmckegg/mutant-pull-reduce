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

### `pullReduce(stream, reducer, opts)`

**`stream`:** A `source` or `through` [pull-stream](https://github.com/pull-stream/pull-stream) to suck data from.

**`reducer(lastValue, item)`**: expects the new value to be returned

**`opts`**:
 - startValue
 - nextTick
