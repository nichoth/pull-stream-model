var pushable = require('pull-pushable')

function MessageSource (msgs) {
    var p = pushable()
    var keys = Object.keys(msgs)
    keys.forEach(function (k) {
        return p.push[k] = function (data) {
            p.push(msgs[k](data))
        }
    })
    return p
}

module.exports = MessageSource

