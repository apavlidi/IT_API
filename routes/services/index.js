const express = require('express')
const router = express.Router()
const auth = require('../../configs/auth')
const config = require('../../configs/config')
const ldapFunctions = require('../ldapFunctions')
const ApplicationErrorClass = require('./../applicationErrorClass')
const apiFunctions = require('./../apiFunctions')
const functions = require('./functions')

let ldapMain = config.LDAP_CLIENT

router.get('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), getServiceStatus)
router.patch('/ssh/users', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), sshChangeStatusUsers)
router.patch('/ssh/aetos', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), sshChangeStatusAetos)

function sshChangeStatusAetos (req, res, next) {
  let ldapBinded = null
  ldapFunctions.bindLdap(ldapMain).then(ldapMainBinded => {
    ldapBinded = ldapMainBinded
    let opts = ldapFunctions.buildOptions('(&(id=' + req.user.id + ')(objectClass=extensibleObject))', 'sub', ['info'])
    return ldapFunctions.searchUserOnLDAP(ldapBinded, opts)
  }).then(user => {
    if (functions.usersExistsAndIsActive(user)) {
      if (functions.sshIsActivatedOnVM(user, 'aetos')) {
        return functions.disableSshFromVM(ldapBinded, user, 'aetos')
      } else {
        return functions.enableSshFromVm(ldapBinded, user, 'aetos')
      }
    } else {
      throw new ApplicationErrorClass('sshChangeStatusAetos', null, 4021, null, 'Ο χρήστης δεν βρέθηκε ή δεν είναι ενεργοποιημένος.', apiFunctions.getClientIp(req), 500)
    }
  }).then(() => {
    res.sendStatus(200)
  }).catch(applicationError => {
    applicationError.type = 'sshChangeStatusAetos'
    applicationError.user = req.user.id
    applicationError.ip = apiFunctions.getClientIp(req)
    next(applicationError)
  })
}

function sshChangeStatusUsers (req, res, next) {
  let ldapBinded = null
  ldapFunctions.bindLdap(ldapMain).then(ldapMainBinded => {
    ldapBinded = ldapMainBinded
    let opts = ldapFunctions.buildOptions('(&(id=' + req.user.id + ')(objectClass=extensibleObject))', 'sub', ['info'])
    return ldapFunctions.searchUserOnLDAP(ldapBinded, opts)
  }).then(user => {
    if (functions.usersExistsAndIsActive(user)) {
      if (functions.sshIsActivatedOnVM(user, 'users')) {
        return functions.disableSshFromVM(ldapBinded, user, 'users')
      } else {
        return functions.enableSshFromVm(ldapBinded, user, 'users')
      }
    } else {
      throw new ApplicationErrorClass('sshChangeStatusUsers', null, 4013, null, 'Ο χρήστης δεν βρέθηκε ή δεν είναι ενεργοποιημένος.', apiFunctions.getClientIp(req), 500)
    }
  }).then(() => {
    res.sendStatus(200)
  }).catch(applicationError => {
    applicationError.type = 'sshChangeStatusUsers'
    applicationError.user = req.user.id
    applicationError.ip = apiFunctions.getClientIp(req)
    next(applicationError)
  })
}

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
              next(new ApplicationErrorClass('getServiceStatus', req.user.id, 4000, err, 'Συνέβη κάποιο σφάλμα λήψη στοιχείων', apiFunctions.getClientIp(req), 500))
            } else {
              res.json({
                info: ['active']
              })
            }
          })
        })
      }
    } else {
      next(new ApplicationErrorClass('getServiceStatus', req.user.id, 4001, null, 'Ο χρήστης δεν βρέθηκε', apiFunctions.getClientIp(req), 500))
    }
  }).catch(applicationError => {
    applicationError.type = 'getServiceStatus'
    applicationError.user = req.user.id
    applicationError.ip = apiFunctions.getClientIp(req)
    next(applicationError)
  })
}

module.exports = {
  router
}
