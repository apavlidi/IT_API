const express = require('express')
const router = express.Router()
const Joi = require('joi')

const auth = require('../../../configs/auth')
const config = require('../../../configs/config')
const functions = require('./functions')
const apiFunctions = require('../../apiFunctions')
const ApplicationErrorClass = require('../../applicationErrorClass')
const ldapFunctions = require('../../ldapFunctions')
const validSchemas = require('./joi')
const ldapConfig = require('../../../configs/ldap')

let ldapMain = config.LDAP_CLIENT

router.get('/:id', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), getUser)
router.post('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.validateInput('body', validSchemas.addUser), addUser)
router.delete('/:id', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), deleteUser)
router.patch('/:id', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.validateInput('body', validSchemas.updateUser), updateUser)

function updateUser (req, res, next) {
  let attr = req.body.attr
  let newValue = req.body.value
  let userID = req.params.id
  let ldapMainBinded
  if (attr === 'userPassword') {
    newValue = ldapConfig.DEFAULT_PASSWORD
  }
  ldapFunctions.bindLdap(ldapMain).then(ldapBinded => {
    ldapMainBinded = ldapBinded
    let options = ldapFunctions.buildOptions('(id=' + userID + ')', 'sub', ['id']) //check if this is the correct id
    return ldapFunctions.searchUserOnLDAP(ldapMain, options)
  }).then(user => {
    if (user) {
      return functions.modifyAttributeOnLdapbyAdmin(ldapMainBinded, attr, newValue, user)
    } else {
      throw new ApplicationErrorClass('updateUser', req.user.id, 3343, null, 'Συνέβη κάποιο σφάλμα κατα την ενημέρωση χρήστη', apiFunctions.getClientIp(req), 500)
    }
  }).then(() => {
    res.sendStatus(200)
  }).catch(function (applicationError) {
    applicationError.type = 'updateUser'
    applicationError.user = req.user.id
    applicationError.ip = apiFunctions.getClientIp(req)
    next(applicationError)
  })
}

function getUser (req, res, next) {
  let userId = req.params.id
  let options = ldapFunctions.buildOptions('(id=' + userId + ')', 'sub', [])
  ldapFunctions.searchUserOnLDAP(ldapMain, options).then(user => {
    if (user) {
      if (user.userPassword === ldapConfig.DEFAULT_PASSWORD) {
        user.accountStatus = 0
      } else {
        user.accountStatus = 1
      }
      if (req.query.fields) {
        user = functions.fieldsQuery(user, req.query)
      }
      res.send(user)
    } else {
      next(new ApplicationErrorClass('getUser', null, 3300, null, 'Συνεβη καποιο λάθος κατα την λήψη χρήστη', apiFunctions.getClientIp(req), 500))
    }
  }).catch(function (applicationError) {
    applicationError.type = 'getUser'
    applicationError.user = req.user.id
    applicationError.ip = apiFunctions.getClientIp(req)
    next(applicationError)
  })
}

function addUser (req, res, next) {
  let newUser = functions.buildUser(req.body)

  Joi.validate(newUser, validSchemas.initializeUser).then(userInitialized => {
    newUser = userInitialized
    return ldapFunctions.bindLdap(ldapMain)
  }).then(ldapBinded => {
    return functions.createUser(ldapBinded, newUser)
  }).then(() => {
    res.sendStatus(200)
  }).catch(function (applicationError) {
    applicationError.type = 'getUser'
    applicationError.user = req.user.id
    applicationError.ip = apiFunctions.getClientIp(req)
    next(applicationError)
  })
}

function deleteUser (req, res, next) {
  let userID = req.params.id
  let ldapMainBinded
  ldapFunctions.bindLdap(ldapMain).then(ldapBinded => {
    ldapMainBinded = ldapBinded
    let options = ldapFunctions.buildOptions('(id=' + userID + ')', 'sub', ['id']) //check if this is the correct id
    return ldapFunctions.searchUserOnLDAP(ldapMain, options)
  }).then(user => {
    if (user) {
      return functions.removeUserFromLdap(ldapMainBinded, user.dn)
    } else {
      throw new ApplicationErrorClass('deleteUser', null, 3331, null, 'Ο χρήστης δεν υπάρχει', null, 500)
    }
  }).then(() => {
    return functions.removeProfileUser(userID)
  }).then(() => {
    res.sendStatus(200)
  }).catch(function (applicationError) {
    applicationError.type = 'deleteUser'
    applicationError.user = req.user.id
    applicationError.ip = apiFunctions.getClientIp(req)
    next(applicationError)
  })
}

module.exports = {
  router
}