var S = require('pull-stream/pull')
var map = require('pull-stream/throughs/map')
var filter = require('pull-stream/throughs/filter')
var scan = require('pull-scan')

function ShouldUpdate(test) {
    return S(
        map(function (ev) {
            return { orig: ev }
        }),
        scan(function (prev, next) {
            var _prev = prev ? prev.orig : null
            return {
                update: test(_prev, next.orig),
                orig: next.orig
            }
        }, null),
        filter(function (ev) {
            return ev.update
        }),
        map(function (ev) {
            return ev.orig
        })
    )
}

module.exports = ShouldUpdate
