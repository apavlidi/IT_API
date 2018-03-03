class LogEntry {
  constructor (type, user, action, status, ref, error, track, text, ip) {

    this.type = type
    this.user = user
    this.action = action
    this.status = status
    this.ref = ref
    this.error = error
    this.track = track
    this.text = text
    this.ip = ip
  }
}

module.exports = LogEntry
