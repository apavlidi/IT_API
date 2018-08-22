const express = require('express')
const router = express.Router()
const auth = require('../../../configs/auth')
const config = require('../../../configs/config')
const validSchemas = require('./joi')
const ApplicationError = require('../../applicationErrorClass')
const Log = require('../../logClass')
const apiFunctions = require('./../../apiFunctions')
const database = require('./../../../configs/database')

router.patch('/:conf', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.professorWithMaxAccess), apiFunctions.validateInput('body', validSchemas.updateConfig), updateConfig)

function updateConfig (req, res, next) {
  let conf = req.params.conf
  let data = req.body.data

  database.LDAPConfigs.findOneAndUpdate({conf: conf}, {value: data}).exec(function (err, entry) {
    if (err || !entry) {
      next(new ApplicationError('updateConfig', req.user.id, 3100, err, 'Συνέβη κάποιο σφάλμα κατα την εύρεση', apiFunctions.getClientIp(req), 500))
    } else {
      let log = new Log('updateConfig', req.user.id, 'Η ρυθμιση ενημερώθηκε επιτυχώς', apiFunctions.getClientIp(req), 200)
      log.logAction('ldap')
      res.sendStatus(200)
    }
  })
}

module.exports = {
  router
}
