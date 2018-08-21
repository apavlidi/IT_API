const log = require('./../configs/log')

class LogClass {
  constructor (type, user, text, ip, httpCode) {
    this.type = type
    this.user = user
    this.ip = ip
    this.text = text
    this.httpCode = httpCode
  }

  logAction (logDestination) {
    log[logDestination].info(this.type, this.user, this.text, this.ip)
  }
}

module.exports = LogClass
