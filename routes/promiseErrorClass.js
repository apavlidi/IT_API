class PromiseErrorClass {
  constructor (code, error, httpCode = 500) {
    this.code = code
    this.error = error
    this.httpCode = httpCode
  }
}

module.exports = PromiseErrorClass
