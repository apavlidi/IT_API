const express = require('express')
const router = express.Router()

const ApplicationError = require('../../applicationErrorClass')
const Log = require('../../logClass')
const auth = require('../../../configs/auth')
const config = require('../../../configs/config')
const database = require('../../../configs/database')
const apiFunctions = require('./../../apiFunctions')
const getClientIp = require('../../apiFunctions').getClientIp
const validSchemas = require('./joi')
const ldapFunctions = require('../../ldapFunctions')
const functions = require('./functions')

let ldapMain = config.LDAP_CLIENT

router.get('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.professorWithMaxAccess), apiFunctions.formatQuery, getAccountTypes)
router.post('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.professorWithMaxAccess), apiFunctions.validateInput('body', validSchemas.addAccType), addAccountType)
router.delete('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.professorWithMaxAccess), apiFunctions.validateInput('body', validSchemas.deleteAccType), deleteAccountType)
router.patch('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.professorWithMaxAccess), apiFunctions.validateInput('body', validSchemas.editAccType), editAccountType)

function editAccountType (req, res, next) {
  let basedn = req.body.basedn
  functions.editAccountType(req.body, basedn).then(() => {
    let log = new Log('editAccountType', req.user.id, 'Ο τύπος ενημερώθηκε επιτυχώς', getClientIp(req), 200)
    log.logAction('ldap')
    res.sendStatus(200)
  }).catch(function (promiseErr) {
    let applicationError = new ApplicationError('editAccountType', req.user.id, promiseErr.code,
      promiseErr.error, 'Σφάλμα κατα την ενημέρωση τύπου.', getClientIp(req), promiseErr.httpCode)
    next(applicationError)
  })
}

function deleteAccountType (req, res, next) {
  let basedn = req.body.basedn
  ldapFunctions.bindLdap(ldapMain).then(ldapBinded => {
    ldapBinded.del(basedn, function (err) {
      if (err) {
        next(new ApplicationError('deleteAccountType', req.user.id, 3021, err, 'Συνεβη καποιο λάθος κατα την διαγραφή τύπου.', getClientIp(req), 500))
      } else {
        database.AccountType.remove({basedn: basedn}, function (err) {
          if (err) {
            next(new ApplicationError('deleteAccountType', req.user.id, 3022, err, 'Συνεβη καποιο λάθος κατα την διαγραφή τύπου.', getClientIp(req), 500))
          } else {
            let log = new Log('deleteAccountType', req.user.id, 'Ο τύπος διαγράφηκε επιτυχώς', getClientIp(req), 200)
            log.logAction('ldap')
            res.sendStatus(200)
          }
        })
      }
    })
  })
}

function getAccountTypes (req, res, next) {
  database.AccountType.find(req.query.filters).select(req.query.fields).sort(req.query.sort).skip(parseInt(req.query.page) * parseInt(req.query.limit)).limit(parseInt(req.query.limit)).exec(function (err, result) {
    if (err) {
      next(new ApplicationError('getConf', req.user.id, 3000, err, 'Συνεβη καποιο λάθος κατα την λήψη τύπων.', getClientIp(req), 500, false))
    } else {
      res.send(result)
    }
  })
}

function addAccountType (req, res, next) {
  let ldapMainBinded
  let newType = new database.AccountType({
    title: req.body.title_main,
    value: req.body.value_main,
    basedn: req.body.basedn
  })
  if (req.body.dec_main) {
    newType.dec = req.body.dec_main
  }
  ldapFunctions.bindLdap(ldapMain).then(ldapBinded => {
    ldapMainBinded = ldapBinded
    return functions.addAccountTypeToLDAP(ldapMainBinded, newType.basedn, newType.value)
  }).then(() => {
    functions.addAccountTypeToDB(newType, req.body)
  }).then(() => {
    let log = new Log('addAccountType', req.user.id, 'Ο τύπος δημιουργήθηκε επιτυχώς', getClientIp(req), 200)
    log.logAction('ldap')
    res.sendStatus(200)
  }).catch(function (promiseErr) {
    let applicationError = new ApplicationError('addAccountType', req.user.id, promiseErr.code,
      promiseErr.error, 'Σφάλμα κατα την δημιουργία τύπου.', getClientIp(req), promiseErr.httpCode)
    next(applicationError)
  })
}

module.exports = {
  router
}
