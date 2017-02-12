var test = require('tape')
var S = require('pull-stream')
var MsgSource = require('../message-source')

test('message source', function (t) {
    t.plan(2)

    var msgs = {
        foo: function (data) {
            return ['foo', data]
        },
        bar: function (data) {
            return ['bar', data]
        }
    }

    var source = MsgSource(msgs)
    source.push.foo(1)
    source.push.bar(2)

    S(
        source,
        S.collect(function (err, res) {
            t.error(err)
            t.deepEqual(res, [
                ['foo', 1],
                ['bar', 2]
            ], 'should push the events')
        })
    )

    source.end()
})
