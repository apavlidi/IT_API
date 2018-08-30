const express = require('express')
const router = express.Router()
const Joi = require('joi')

const auth = require('../../../configs/auth')
const config = require('../../../configs/config')
const functions = require('./functions')
const apiFunctions = require('../../apiFunctions')
const getClientIp = require('./../../apiFunctions').getClientIp
const ApplicationError = require('../../applicationErrorClass')
const Log = require('../../logClass')
const ldapFunctions = require('../../ldapFunctions')
const validSchemas = require('./joi')
const ldapConfig = require('../../../configs/ldap')

let ldapMain = config.LDAP_CLIENT

router.get('/:id', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.professorWithMaxAccess), getUser)
router.post('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.professorWithMaxAccess), apiFunctions.validateInput('body', validSchemas.addUser), addUser)
router.delete('/:id', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.professorWithMaxAccess), deleteUser)
router.patch('/:id', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.professorWithMaxAccess), apiFunctions.validateInput('body', validSchemas.updateUser), updateUser)

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
    let options = ldapFunctions.buildOptions('(id=' + userID + ')', 'sub', ['id']) // check if this is the correct id
    return ldapFunctions.searchUserOnLDAP(ldapMain, options)
  }).then(user => {
    if (user) {
      return functions.modifyAttributeOnLdapbyAdmin(ldapMainBinded, attr, newValue, user)
    } else {
      throw new ApplicationError('updateUser', req.user.id, 3343, null, 'Συνέβη κάποιο σφάλμα κατα την ενημέρωση χρήστη', getClientIp(req), 500)
    }
  }).then(() => {
    let log = new Log('updateUser', req.user.id, 'Ο χρήστης ενημερώθηκε επιτυχώς', getClientIp(req), 200)
    log.logAction('ldap')
    res.sendStatus(200)
  }).catch(function (promiseErr) {
    let applicationError = new ApplicationError('updateUser', req.user.id, promiseErr.code,
      promiseErr.error, 'Σφάλμα κατα την ενημέρωση χρήστη.', getClientIp(req), promiseErr.httpCode)
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
      next(new ApplicationError('getUser', null, 3300, null, 'Συνεβη καποιο λάθος κατα την λήψη χρήστη', getClientIp(req), 500, false))
    }
  }).catch(function (promiseErr) {
    let applicationError = new ApplicationError('getUser', req.user.id, promiseErr.code,
      promiseErr.error, 'Σφάλμα κατα την λήψη χρήστη.', getClientIp(req), promiseErr.httpCode, false)
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
    let log = new Log('addUser', req.user.id, 'Ο χρήστης δημιουργήθηκε επιτυχώς', getClientIp(req), 200)
    log.logAction('ldap')
    res.sendStatus(200)
  }).catch(function (promiseErr) {
    let applicationError = new ApplicationError('addUser', req.user.id, promiseErr.code,
      promiseErr.error, 'Σφάλμα κατα την προσθήκη χρήστη.', getClientIp(req), promiseErr.httpCode)
    next(applicationError)
  })
}

function deleteUser (req, res, next) {
  let userID = req.params.id
  let ldapMainBinded
  ldapFunctions.bindLdap(ldapMain).then(ldapBinded => {
    ldapMainBinded = ldapBinded
    let options = ldapFunctions.buildOptions('(id=' + userID + ')', 'sub', ['id']) // check if this is the correct id
    return ldapFunctions.searchUserOnLDAP(ldapMain, options)
  }).then(user => {
    if (user) {
      return functions.removeUserFromLdap(ldapMainBinded, user.dn)
    } else {
      throw new ApplicationError('deleteUser', req.user.id, 3331, null, 'Ο χρήστης δεν υπάρχει', getClientIp(req), 500)
    }
  }).then(() => {
    return functions.removeProfileUser(userID)
  }).then(() => {
    let log = new Log('deleteUser', req.user.id, 'Ο χρήστης διαγράφτηκε επιτυχώς', getClientIp(req), 200)
    log.logAction('ldap')
    res.sendStatus(200)
  }).catch(function (promiseErr) {
    let applicationError = new ApplicationError('deleteUser', req.user.id, promiseErr.code,
      promiseErr.error, 'Σφάλμα κατα την διαγραφή χρήστη.', getClientIp(req), promiseErr.httpCode)
    next(applicationError)
  })
}

module.exports = {
  router
}
