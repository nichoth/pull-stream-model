var test = require('tape')
var S = require('pull-stream')
var shouldUpdate = require('../should-update')

test('should update', function (t) {
    t.plan(6)
    S(
        S.values([1,2,3]),
        shouldUpdate(function (prev, next) {
            return prev + next === 3
        }),
        S.collect(function (err, res) {
            t.error(err)
            t.deepEqual(res, [2], 'should filter the stream')
        })
    )

    S(
        S.values([1,2,3]),
        shouldUpdate(function (prev, next) { return true }),
        S.collect(function (err, res) {
            t.error(err)
            t.deepEqual(res, [1,2,3], 'should not filter anything')
        })
    )

    S(
        S.values([1,2,3]),
        shouldUpdate(function (pres, next) { return false }),
        S.collect(function (err, res) {
            t.error(err)
            t.deepEqual(res, [], 'should filter everything')
        })
    )
})
