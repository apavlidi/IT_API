const express = require('express')
const router = express.Router()
const validSchemas = require('./joi')

const ApplicationErrorClass = require('../../applicationErrorClass')
const auth = require('../../../configs/auth')
const config = require('../../../configs/config')
const ldapFunctions = require('../../ldapFunctions')
const functions = require('./functions')
const apiFunctions = require('./../../apiFunctions')

let ldapMain = config.LDAP_CLIENT

router.get('/:id?', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), getGroups)
router.post('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.validateInput('body', validSchemas.addGroup), addGroup)
router.delete('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.validateInput('body', validSchemas.deleteGroup), deleteGroup)

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
      res.sendStatus(200)
    }).catch(function (applicationError) {
      applicationError.type = 'addGroup'
      applicationError.user = req.user.id
      applicationError.ip = apiFunctions.getClientIp(req)
      next(applicationError)
    })
  })
}

function deleteGroup (req, res, next) {
  ldapFunctions.bindLdap(ldapMain).then(ldapBinded => {
    ldapBinded.del(req.body.dn, function (err) {
      if (err) {
        next(new ApplicationErrorClass('deleteGroup', req.user.id, 3221, err, 'Συνέβη κάποιο σφάλμα κατα την διαγραφή ομάδας', apiFunctions.getClientIp(req), 500))
      } else {
        res.sendStatus(200)
      }
    })
  })
}

module.exports = {
  router
}