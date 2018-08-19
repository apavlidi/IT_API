const apiFunctions = require('./../routes/apiFunctions')

class ApplicationErrorClass {
  constructor (type, user, code, error, text, ip, httpCode, logging) {
    this.type = type
    this.user = user
    this.code = code
    this.error = error
    this.ip = ip
    this.text = text
    this.httpCode = httpCode
    this.logging = logging

    if (logging) {
      console.log('You chose to log the error...')
      apiFunctions.logging('error', this.type, this.user, this.code, this.error, this.text, this.ip)
    }
  }
}

module.exports = ApplicationErrorClass
