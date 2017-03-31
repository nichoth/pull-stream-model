function Message (type, data) {
    if (!data) return function (data) {
        return Message(type, data)
    }
    return [type, data]
}

Message.type = function (msg) { return msg[0] }
Message.data = function (msg) { return msg[1] }
Message.find = function (path, msg) {
    var _path = path.slice()
    var _msg = msg
    while (_path.length) {
        if (_path.shift() === _msg[0]) _msg = msg[1]
        else return undefined
    }
    return _msg
}

module.exports = Message
