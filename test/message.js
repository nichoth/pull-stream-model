var Message = require('../message')
var test = require('tape')

test('find a nested message', function (t) {
    t.plan(2)
    var msg = Message('a', Message('b', Message('c', 'data')))
    var m = Message.find(['a', 'b'], msg)
    t.deepEqual(m, ['b', ['c', 'data'] ], 'should return nested message')
    t.equal(Message.find(['a', 'c'], msg), undefined,
        'should return undefined if the path doesnt match')
})

