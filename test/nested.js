var test = require('tape')
var xtend = require('xtend')
var async = require('pull-async')
var cat = require('pull-cat')
var S = require('pull-stream')
var Component = require('../')
var pushable = require('pull-pushable')

function Child () {
    return ''
}
Child.update = {
    bar: function (state, ev) {
        return state + ev
    },
    start: (state, ev) => state + ' resolving',
    resolve: (state, ev) => state.replace(' resolving', '')
}
Child.effects = {
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

function Parent () {
    return {
        string: '',
        child: Child()
    }
}
Parent.update = {
    bar: (state, ev) => xtend(state, { string: ev }),
    child: Child.update
}
Parent.effects = {
    foo: function (state, msg, ev) {
        return msg.bar(ev + '!!!')
    },
    child: Child.effects
}



test('model', function (t) {
    t.plan(2)
    var parent = Component(Parent)
    var p = pushable()
    p.push(parent.msg.bar('hi'))
    p.push(parent.msg.child.bar('test'))
    p.end()

    S(
        p,
        parent.effects(),
        parent.store,
        S.collect(function (err, res) {
            t.error(err)
            t.deepEqual(res, [
                { string: '', child: '' },
                { string: 'hi', child: '' },
                { string: 'hi', child: 'test' }
            ], 'should nest everything')
        })
    )
})


