const express = require('express')
const router = express.Router()
const auth = require('../../../configs/auth')
const config = require('../../../configs/config')
const validSchemas = require('./joi')
const ApplicationErrorClass = require('../../applicationErrorClass')
const apiFunctions = require('./../../apiFunctions')
const database = require('./../../../configs/database')

router.patch('/:conf', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.validateInput('body', validSchemas.updateConfig), updateConfig)

function updateConfig (req, res, next) {
  let conf = req.params.conf
  let data = req.body.data
  console.log(req.body)
  console.log(req.params)

  database.LDAPConfigs.findOneAndUpdate({conf: conf}, {value: data}).exec(function (err, entry) {
    if (err || !entry) {
      next(new ApplicationErrorClass('updateConfig', req.user.id, 88, err, 'Συνέβη κάποιο σφάλμα κατα την εύρεση', apiFunctions.getClientIp(req), 500))
    } else {
      res.sendStatus(200)
    }
  })
}

module.exports = {
  router
}