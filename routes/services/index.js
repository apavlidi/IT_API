const express = require('express')
const router = express.Router()
const ldap = require('ldapjs')
const auth = require('../../configs/auth')
const config = require('../../configs/config')
const ldapFunctions = require('../ldapFunctions')
const ApplicationErrorClass = require('./../applicationErrorClass')
const apiFunctions = require('./../apiFunctions')
const functions = require('./functions')

let ldapMain = config.LDAP_CLIENT

router.get('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), getServiceStatus)

function getServiceStatus (req, res, next) {
  let ldapBinded = null
  ldapFunctions.bindLdap(ldapMain).then(ldapMainBinded => {
    ldapBinded = ldapMainBinded
    let opts = ldapFunctions.buildOptions('(id=' + req.user.id + ')', 'sub', ['info', 'eduPersonAffiliation', 'eduPersonPrimaryAffiliation', 'regyear', 'uid'])
    return ldapFunctions.searchUserOnLDAP(ldapBinded, opts)
  }).then(user => {
    if (user) {
      if (user.info) {
        res.json({
          info: user.info
        })
      } else {
        functions.activateUser(user).then(changes => {
          ldapBinded.modify(req.user.dn, changes, function (err) {
            if (err) {
              next(new ApplicationErrorClass('getServiceStatus', req.user.id, 0, err, 'Συνέβη κάποιο σφάλμα λήψη στοιχείων', apiFunctions.getClientIp(req), 500))
            } else {
              res.json({
                info: ['active']
              })
            }
          })
        })
      }
    } else {
      next(new ApplicationErrorClass('getServiceStatus', req.user.id, 0, null, 'Ο χρήστης δεν βρέθηκε', apiFunctions.getClientIp(req), 500))
    }
  })
}

module.exports = {
  router
}
