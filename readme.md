# pull stream model

Trying ways to model application state

This creates a state machine from an object where the keys describe event types. An `update` object is used to create a scan function that handles changing the app state in response to events. It looks like this.

```js
var update = {
    bar: function (state, ev) {
        return state + ev
    },
    start: (state, ev) => state + ' resolving',
    resolve: (state, ev) => state.replace(' resolving', '')
}
```

Effects is an object used to filter and map events. Since mapping can be asynchronous, this is where you would put any IO, like network requests. 

```js
var effects = {
    foo: function (state, msg, ev) {
        return msg.bar(ev + '!!!')
    },
    asyncThing: function (state, msg, ev) {
        // async actions still have a return value -- a new pull stream
        // this gets `join`ed into the main event stream
        return cat([
            S.once(msg.start()),
            async(function (cb) {
                setTimeout(function () {
                    cb(null, msg.resolve())
                }, 100)
            })
        ])
    },
    baz: function (state, msg, ev) {
        // you can filter by returning an empty stream
        return S.empty()
    }
}
```

These functions get called with a `msg` argument, which is an object that returns "messages". The messages are just arrays, which means they can be easily serialized. 

The functions in `update` or `effects` can be nested to any depth, too, and it will be called with the corresponding sub-tree of state.

## example

### model

```js
var test = require('tape')
var async = require('pull-async')
var cat = require('pull-cat')
var S = require('pull-stream')
var Component = require('../')
var pushable = require('pull-pushable')

function Model () {
    return ''
}
Model.update = {
    bar: function (state, ev) {
        return state + ev
    },
    start: (state, ev) => state + ' resolving',
    resolve: (state, ev) => state.replace(' resolving', '')
}
Model.effects = {
    foo: function (state, msg, ev) {
        return msg.bar(ev + '!!!')
    },
    asyncThing: function (state, msg, ev) {
        return cat([
            S.once(msg.start()),
            async(function (cb) {
                setTimeout(function () {
                    cb(null, msg.resolve())
                }, 100)
            })
        ])
    }
}


test('model', function (t) {
    t.plan(2)
    var model = Component(Model)
    var p = pushable()
    p.push(model.msg.foo('hello'))
    p.push(model.msg.bar(' hi'))
    p.push(model.msg.asyncThing())
    p.end()

    S(
        p,
        // S.through(console.log.bind(console, 'ev')),
        model.effects(),
        model.store,
        S.collect(function (err, res) {
            t.error(err)
            t.deepEqual(res, [
                '',
                'hello!!!',
                'hello!!! hi',
                'hello!!! hi resolving',
                'hello!!! hi'
            ], 'should do the thing')
        })
    )
})
```

### should update

This is for filtering events when you need to know the current and also the last state. It is used in the same role as react's `shouldComponentUpdate`.

```js
var shouldUpdate = require('pull-stream-model/should-update')

S(
    S.values([1,2,3]),
    // if this is the first event, then `prev` is null
    shouldUpdate(function (prev, next) {
        return prev + next === 3
    }),
    S.collect(function (err, res) {
        t.error(err)
        t.deepEqual(res, [2], 'should filter the stream')
    })
)
```
