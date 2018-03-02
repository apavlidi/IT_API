module.exports = function LogError (creator, action, status, category, error, track, logText, message) {
  Error.captureStackTrace(this, this.constructor)
  this.creator = creator
  this.action = action
  this.status = status
  this.category = category
  this.error = error
  this.track = track
  this.logText = logText
  (message === null) ? this.message = logText : this.message = message
}

require('util').inherits(module.exports, Error)