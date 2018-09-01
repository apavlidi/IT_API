const express = require('express')
const router = express.Router()
const auth = require('../../configs/auth')
const config = require('../../configs/config')
const ldapFunctions = require('../ldapFunctions')
const ApplicationError = require('./../applicationErrorClass')
const Log = require('./../logClass')
const getClientIp = require('./../apiFunctions').getClientIp
const functions = require('./functions')

let ldapMain = config.LDAP_CLIENT

router.get('/', auth.checkAuth(['services'], config.PERMISSIONS.student), getServiceStatus)
router.patch('/ssh/users', auth.checkAuth(['edit_services'], config.PERMISSIONS.student), sshChangeStatusUsers)
router.patch('/ssh/aetos', auth.checkAuth(['edit_services'], config.PERMISSIONS.student), sshChangeStatusAetos)

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
      throw new ApplicationError('sshChangeStatusAetos', req.user.id, 4021, null, 'Ο χρήστης δεν βρέθηκε ή δεν είναι ενεργοποιημένος.', getClientIp(req), 500)
    }
  }).then(() => {
    let log = new Log('sshChangeStatusAetos', req.user.id, 'Η ρυθμιση ενημερώθηκε επιτυχώς', getClientIp(req), 200)
    log.logAction('services')
    res.sendStatus(200)
  }).catch(promiseErr => {
    let applicationError = new ApplicationError('sshChangeStatusAetos', req.user.id, promiseErr.code,
      promiseErr.error, 'Σφάλμα κατά την λήψη αρχείου.', getClientIp(req), promiseErr.httpCode)
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
      throw new ApplicationError('sshChangeStatusUsers', req.user.id, 4013, null, 'Ο χρήστης δεν βρέθηκε ή δεν είναι ενεργοποιημένος.', getClientIp(req), 500)
    }
  }).then(() => {
    let log = new Log('sshChangeStatusUsers', req.user.id, 'Η ρυθμιση ενημερώθηκε επιτυχώς', getClientIp(req), 200)
    log.logAction('services')
    res.sendStatus(200)
  }).catch(promiseErr => {
    let applicationError = new ApplicationError('sshChangeStatusUsers', req.user.id, promiseErr.code,
      promiseErr.error, 'Σφάλμα κατά την λήψη αρχείου.', getClientIp(req), promiseErr.httpCode)
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
              next(new ApplicationError('getServiceStatus', req.user.id, 4000, err, 'Συνέβη κάποιο σφάλμα λήψη στοιχείων', getClientIp(req), 500, false))
            } else {
              res.json({
                info: ['active']
              })
            }
          })
        })
      }
    } else {
      next(new ApplicationError('getServiceStatus', req.user.id, 4001, null, 'Ο χρήστης δεν βρέθηκε', getClientIp(req), 500, false))
    }
  }).catch(promiseErr => {
    let applicationError = new ApplicationError('getServiceStatus', req.user.id, promiseErr.code,
      promiseErr.error, 'Σφάλμα κατά την λήψη στοιχείων.', getClientIp(req), promiseErr.httpCode, false)
    next(applicationError)
  })
}

module.exports = {
  router
}
