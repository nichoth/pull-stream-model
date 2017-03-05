var xtend = require('xtend')
var flatMerge = require('pull-flat-merge')
var Scan = require('pull-scan')
var S = require('pull-stream/pull')
S.through = require('pull-stream/throughs/through')
S.map = require('pull-stream/throughs/map')
S.once = require('pull-stream/sources/once')
S.asyncMap = require('pull-stream/throughs/async-map')
S.filter = require('pull-stream/throughs/filter')
var cat = require('pull-cat')

function Messages (effects, update, namespace) {
    var keys = Object.keys(xtend(update, effects))
    var msgs = keys.reduce(function (acc, k) {
        var target = effects[k] || update[k]
        acc[k] = typeof target === 'function' ?
            function (data) {
                return namespace ? [namespace, [k, data]] : [k, data]
            } :
            Messages(effects[k] || {}, update[k], k)
        return acc
    }, {})
    return msgs
}

function _scan (fns) {
    return function (_state, ev) {
        var target = fns[ev[0]]
        if (typeof target === 'function') return target(_state, ev[1])
        var newState = {}
        newState[ev[0]] = _scan(target)(_state[ev[0]], ev[1])
        return xtend(_state, newState)
    }
}

function Component (model) {
    var effects = model.effects || {}
    var msgs = Messages(effects, model.update)
    var state = model()

    var scan = Scan(_scan(model.update), state)

    function call (effects, msgs, path) {
        return function (ev) {
            var target = effects[ev[0]]
            if (!target) return path ? path.concat([ev]) : ev
            if (typeof target === 'function') {
                var _state = (path || []).reduce(function (parent, key) {
                    return parent[key]
                }, state)
                return target(_state, msgs, ev[1])
            }
            // is object
            var _path = (path || []).concat([ev[0]])
            return call(effects[ev[0]], msgs[ev[0]], _path)(ev[1])
        }
    }

    function EffectsStream () {
        var stream = S(
            flatMerge(),
            S.map(call(effects, msgs)),
            S.filter(Boolean),
            flatMerge()
        )
        return stream
    }

    var store = S(
        scan,
        S.through(function (_state) {
            state = _state
        })
    )

    return {
        effects: EffectsStream,
        store: function storeSink (source) {
            var live = S( source, store )
            return cat([ S.once(state), live ])
        },
        msg: msgs
    }
}

module.exports = Component
