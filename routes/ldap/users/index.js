const express = require('express')
const router = express.Router()
const auth = require('../../../configs/auth')
const config = require('../../../configs/config')
const functionsUser = require('./../../user/user/function')
const functions = require('./functions')
const ldapFunctions = require('../../ldapFunctions')

let ldapMain = config.LDAP_CLIENT

router.get('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), getAllUsers)
router.post('/sendmail', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), sendActivationMail)

function getAllUsers (req, res, next) {
  functionsUser.ldapSearchQueryFormat(req.query, false)
    .then(function (options) {
      return ldapFunctions.searchUsersOnLDAP(ldapMain, options)
    }).then(users => {
    let usersSorted = functionsUser.checkForSorting(users, req.query)
    res.status(200).json(usersSorted)
  }).catch(function (applicationError) {
    next(applicationError)
  })
}

function sendActivationMail (req, res, next) {
  let users = req.body.usersID
  if (users) {
    let userIDs = users.split(',')
    functions.sendActivationMailToAllUsers(userIDs).then(() => {
      res.sendStatus(200)
    }).catch(function (applicationError) {
      next(applicationError)
    })
  }
}

module.exports = {
  router
}