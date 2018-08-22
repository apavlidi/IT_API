const express = require('express')
const router = express.Router()
const validSchemas = require('./joi')

const ApplicationError = require('../../applicationErrorClass')
const Log = require('../../logClass')
const auth = require('../../../configs/auth')
const config = require('../../../configs/config')
const ldapFunctions = require('../../ldapFunctions')
const functions = require('./functions')
const apiFunctions = require('./../../apiFunctions')
const getClientIp = require('./../../apiFunctions').getClientIp

let ldapMain = config.LDAP_CLIENT

router.get('/:id?', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.professorWithMaxAccess), getGroups)
router.post('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.professorWithMaxAccess), apiFunctions.validateInput('body', validSchemas.addGroup), addGroup)
router.delete('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.professorWithMaxAccess), apiFunctions.validateInput('body', validSchemas.deleteGroup), deleteGroup)

function getGroups (req, res, next) {
  let gid = parseInt(req.params.id)
  let options
  if (gid && Number.isInteger(gid)) {
    options = ldapFunctions.buildOptions('(gidNumber=' + gid + ')', 'sub', [])
  } else {
    options = ldapFunctions.buildOptions('(cn=*)', 'sub', [])
  }
  functions.searchGroupsOnLDAP(ldapMain, options).then(groups => {
    res.send(groups)
  }).catch(function (promiseErr) {
    let applicationError = new ApplicationError('getGroups', req.user.id, promiseErr.code,
      promiseErr.error, 'Σφάλμα κατα την λήψη ομάδων.', getClientIp(req), promiseErr.httpCode, false)
    next(applicationError)
  })
}

function addGroup (req, res, next) {
  ldapFunctions.bindLdap(ldapMain).then(ldapBinded => {
    let entry = {}
    entry.objectClass = []
    entry.objectClass[0] = 'posixGroup'
    entry.objectClass[1] = 'top'
    entry.cn = req.body.cn

    functions.checkIfGroupExists(ldapBinded, entry.cn).then(() => {
      return functions.getNextGidNumber()
    }).then(gid => {
      entry.gidNumber = gid
      return functions.addGroupToLdap(ldapBinded, entry)
    }).then(() => {
      let log = new Log('addGroup', req.user.id, 'Η ομάδα δημιουργήθηκε επιτυχώς', getClientIp(req), 200)
      log.logAction('ldap')
      res.sendStatus(200)
    }).catch(function (promiseErr) {
      let applicationError = new ApplicationError('addGroup', req.user.id, promiseErr.code,
        promiseErr.error, 'Σφάλμα κατα την δημιουργία ομάδας.', getClientIp(req), promiseErr.httpCode)
      next(applicationError)
    })
  })
}

function deleteGroup (req, res, next) {
  ldapFunctions.bindLdap(ldapMain).then(ldapBinded => {
    ldapBinded.del(req.body.dn, function (err) {
      if (err) {
        next(new ApplicationError('deleteGroup', req.user.id, 3221, err, 'Συνέβη κάποιο σφάλμα κατα την διαγραφή ομάδας', getClientIp(req), 500))
      } else {
        let log = new Log('deleteGroup', req.user.id, 'Η ομάδα διαγράφηκε επιτυχώς', getClientIp(req), 200)
        log.logAction('ldap')
        res.sendStatus(200)
      }
    })
  }).catch(function (promiseErr) {
    let applicationError = new ApplicationError('deleteGroup', req.user.id, promiseErr.code,
      promiseErr.error, 'Συνέβη κάποιο σφάλμα κατα την διαγραφή ομάδας.', getClientIp(req), promiseErr.httpCode)
    next(applicationError)
  })
}

module.exports = {
  router
}
