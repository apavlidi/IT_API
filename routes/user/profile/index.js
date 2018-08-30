const express = require('express')
const router = express.Router()
const apiFunctions = require('./../../apiFunctions')
const getClientIp = require('./../../apiFunctions').getClientIp
const functionsUser = require('../functionsUser')
const ldapFunctions = require('../../ldapFunctions')
const functions = require('./function')
const ApplicationError = require('./../../applicationErrorClass')
const Log = require('./../../logClass')
const auth = require('../../../configs/auth')
const config = require('../../../configs/config')
const validSchemas = require('./joi')
let ldapMain = config.LDAP_CLIENT
const filter = require('ldap-filters')
const database = require('../../../configs/database')

router.get('/', auth.checkAuth(['profile'], config.PERMISSIONS.student), getUserProfile)
router.patch('/', auth.checkAuth(['edit_profile'], config.PERMISSIONS.student), apiFunctions.validateInput('body', validSchemas.profileUpdate), updatePublicProfile)
router.delete('/photo', auth.checkAuth(['edit_profile'], config.PERMISSIONS.student), deleteProfilePhoto)

function deleteProfilePhoto (req, res, next) {
  database.Profile.findOneAndUpdate({ldapId: req.user.id}, {
    'profilePhoto': {}
  }, function (err, profile) {
    if (err || !profile) {
      next(new ApplicationError('deleteProfilePhoto', req.user.id, 2031, err, 'Συνέβη κάποιο σφάλμα κατα την διαγραφή φωτογραφίας προφιλ', getClientIp(req), 500))
    } else {
      let log = new Log('deleteProfilePhoto', req.user.id, 'Η φωτογραφία διαγράφηκε επιτυχώς', getClientIp(req), 200)
      log.logAction('user')
      res.sendStatus(200)
    }
  })
}

function updatePublicProfile (req, res, next) {
  let dataProfile = req.body
  let ldapBinded = null
  functions.updatePhotoProfileIfNecessary(req.user, req.files).then(() => {
    return functions.updateSocialMediaIfNecessary(req.user.id, req.body)
  }).then(() => {
    return ldapFunctions.bindLdap(ldapMain)
  }).then(ldapMainBinded => {
    ldapBinded = ldapMainBinded
    let output = filter.AND([filter.attribute('id').equalTo(req.user.id)])
    let opts = ldapFunctions.buildOptions(output.toString(), 'sub', 'id')
    return ldapFunctions.searchUserOnLDAP(ldapBinded, opts)
  }).then(user => {
    return functions.modifyAttributesOnLDAPbyProfile(ldapBinded, dataProfile, user.dn)
  }).then(() => {
    let log = new Log('updatePublicProfile', req.user.id, 'Τα στοιχεία ενημερώθηκαν επιτυχώς', getClientIp(req), 200)
    log.logAction('user')
    res.sendStatus(200)
  }).catch(function (promiseErr) {
    let applicationError = new ApplicationError('updatePublicProfile', req.user.id, promiseErr.code,
      promiseErr.error, 'Σφάλμα κατα την ενημέρωση χρήστη.', getClientIp(req), promiseErr.httpCode)
    next(applicationError)
  })
}

function getUserProfile (req, res, next) {
  let opts = ldapFunctions.buildOptions('(id=' + req.user.id + ')', 'sub', functionsUser.buildFieldsQueryLdap(['am', 'id', 'description', 'eduPersonEntitlement', 'pwdChangedTime', 'displayName', 'regyear', 'regsem', 'sem', 'givenName', 'sn', 'fathersname', 'cn', 'secondarymail', 'mail', 'eduPersonAffiliation', 'eduPersonPrimaryAffiliation', 'title', 'telephoneNumber', 'labeledURI'], req.query))
  ldapFunctions.searchUserOnLDAP(ldapMain, opts).then(user => {
    delete user.controls
    delete user.dn
    return functionsUser.appendDatabaseInfo([user], req.query)
  }).then(user => {
    res.status(200).json(user[0])
  }).catch(function (promiseErr) {
    let applicationError = new ApplicationError('getUserProfile', req.user.id, promiseErr.code,
      promiseErr.error, 'Σφάλμα κατα την λήψη χρήστη.', getClientIp(req), promiseErr.httpCode)
    next(applicationError)
  })
}

module.exports = {
  router
}
