const LogClass = require('./logClass')
const logError = require('./../configs/log').error
const _ = require('lodash')

class ApplicationErrorClass extends LogClass {
  constructor (type, user, code, error, text, ip, httpCode, log = true) {
    super(type, user, text, ip, httpCode)
    this.code = code
    this.error = error
    if (log) {
      this.logError()
    }
  }

  logError () {
    let errorMsg
    (_.has(this, 'text')) ? errorMsg = this.text : errorMsg = 'No message submitted'
    logError.error(this.type, this.user, this.code, errorMsg, this.text, this.ip)
  }
}

module.exports = ApplicationErrorClass
