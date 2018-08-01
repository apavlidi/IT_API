const express = require('express')
const router = express.Router()
const ApplicationErrorClass = require('../../applicationErrorClass')
const auth = require('../../../configs/auth')
const config = require('../../../configs/config')
const database = require('../../../configs/database')
const apiFunctions = require('./../../apiFunctions')

router.get('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.formatQuery, getTypes)

function getTypes (req, res, next) {
  database.AccountType.find(req.query.filters).select(req.query.fields).sort(req.query.sort).skip(parseInt(req.query.page) * parseInt(req.query.limit)).limit(parseInt(req.query.limit)).exec(function (err, result) {
    if (err) {
      next(new ApplicationErrorClass('getConf', null, 89, err, 'Συνεβη καποιο λάθος κατα την λήψη τύπων.', apiFunctions.getClientIp(req), 500))
    } else {
      res.send(result)
    }
  })
}

module.exports = {
  router
}