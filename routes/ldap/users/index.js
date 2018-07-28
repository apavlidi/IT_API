var express = require('express')
var router = express.Router()
const auth = require('../../../configs/auth')
const config = require('../../../configs/config')
const functionsUsers = require('../../user/functionsUser')
const functionsUser = require('./../../user/user/function')

let ldapMain = config.LDAP_CLIENT

router.get('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), getAllUsers)

function getAllUsers (req, res, next) {
  functionsUser.ldapSearchQueryFormat(req.query, false)
    .then(function (options) {
      return functionsUser.searchUsersOnLDAP(ldapMain, options)
    }).then(users => {
    let usersSorted = functionsUser.checkForSorting(users, req.query)
    res.status(200).json(usersSorted)
  }).catch(function (applicationError) {
    next(applicationError)
  })
}

module.exports = {
  router
}