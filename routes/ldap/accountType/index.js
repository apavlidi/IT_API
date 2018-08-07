const express = require('express')
const router = express.Router()

const ApplicationErrorClass = require('../../applicationErrorClass')
const auth = require('../../../configs/auth')
const config = require('../../../configs/config')
const database = require('../../../configs/database')
const apiFunctions = require('./../../apiFunctions')
const validSchemas = require('./joi')
const ldapFunctions = require('../../ldapFunctions')
const functions = require('./functions')

let ldapMain = config.LDAP_CLIENT

router.get('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.formatQuery, getAccountTypes)
router.post('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.validateInput('body', validSchemas.addAccType), addAccountType)
router.delete('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.validateInput('body', validSchemas.deleteAccType), deleteAccountType)
router.patch('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.validateInput('body', validSchemas.editAccType), editAccountType)

function editAccountType (req, res, next) {
  let basedn = req.body.basedn
  functions.editAccountType(req.body, basedn).then(() => {
    res.sendStatus(200)
  }).catch(function (applicationError) {
    applicationError.type = 'updateUser'
    applicationError.user = req.user.id
    applicationError.ip = apiFunctions.getClientIp(req)
    next(applicationError)
  })
}

function deleteAccountType (req, res, next) {
  let basedn = req.body.basedn
  ldapFunctions.bindLdap(ldapMain).then(ldapBinded => {
    ldapBinded.del(basedn, function (err) {
      if (err) {
        next(new ApplicationErrorClass('deleteAccountType', req.user.id, 3021, err, 'Συνεβη καποιο λάθος κατα την διαγραφή τύπου.', apiFunctions.getClientIp(req), 500))
      } else {
        database.AccountType.remove({basedn: basedn}, function (err) {
          if (err) {
            next(new ApplicationErrorClass('deleteAccountType', req.user.id, 3022, err, 'Συνεβη καποιο λάθος κατα την διαγραφή τύπου.', apiFunctions.getClientIp(req), 500))
          } else {
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
      next(new ApplicationErrorClass('getConf', req.user.id, 3000, err, 'Συνεβη καποιο λάθος κατα την λήψη τύπων.', apiFunctions.getClientIp(req), 500))
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
    res.sendStatus(200)
  }).catch(function (applicationError) {
    applicationError.type = 'updateUser'
    applicationError.user = req.user.id
    applicationError.ip = apiFunctions.getClientIp(req)
    next(applicationError)
  })
}

module.exports = {
  router
}