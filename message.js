function Message (type, data) {
    if (!data) return function (data) {
        return Message(type, data)
    }
    return [type, data]
}

Message.type = function (msg) { return msg[0] }
Message.data = function (msg) { return msg[1] }

module.exports = Message
