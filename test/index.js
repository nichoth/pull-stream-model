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
                'hello!!!',
                'hello!!! hi',
                'hello!!! hi resolving',
                'hello!!! hi'
            ], 'should do the thing')
        })
    )
})

