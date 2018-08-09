const express = require('express')
const router = express.Router()
const apiFunctions = require('./../../apiFunctions')
const functionsUser = require('../functionsUser')
const ldapFunctions = require('../../ldapFunctions')
const functions = require('./function')
const ApplicationErrorClass = require('./../../applicationErrorClass')
const auth = require('../../../configs/auth')
const config = require('../../../configs/config')
const validSchemas = require('./joi')
let ldapMain = config.LDAP_CLIENT
const filter = require('ldap-filters')
const database = require('../../../configs/database')

router.get('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), getUserProfile)
router.patch('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.validateInput('body', validSchemas.profileUpdate), updatePublicProfile)
router.delete('/photo', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), deleteProfilePhoto)

function deleteProfilePhoto (req, res, next) {
  database.Profile.findOneAndUpdate({ldapId: req.user.id}, {
    'profilePhoto': {},
  }, function (err, profile) {
    if (err || !profile) {
      next(new ApplicationErrorClass('deleteProfilePhoto', req.user.id, 2031, null, 'Συνέβη κάποιο σφάλμα κατα την διαγραφή φωτογραφίας προφιλ', apiFunctions.getClientIp(req), 500))
    } else {
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
    res.sendStatus(200)
  }).catch(function (applicationError) {
    applicationError.type = 'updatePublicProfile'
    applicationError.user = req.user.id
    applicationError.ip = apiFunctions.getClientIp(req)
    next(applicationError)
  })
}

function getUserProfile (req, res, next) {
  let opts = ldapFunctions.buildOptions('(id=' + req.user.id + ')', 'sub', functionsUser.buildFieldsQueryLdap(['am', 'id','description', 'eduPersonEntitlement', 'pwdChangedTime', 'displayName', 'regyear', 'regsem', 'sem', 'givenName', 'sn', 'fathersname', 'cn', 'secondarymail', 'mail', 'eduPersonAffiliation', 'eduPersonPrimaryAffiliation', 'title', 'telephoneNumber', 'labeledURI'], req.query))
  ldapFunctions.searchUserOnLDAP(ldapMain, opts).then(user => {
    delete user.controls
    delete user.dn
    return functionsUser.appendDatabaseInfo([user], req.query)
  }).then(user => {
    res.status(200).json(user[0])
  }).catch(function (applicationError) {
    applicationError.type = 'getUserProfile'
    applicationError.user = req.user.id
    applicationError.ip = apiFunctions.getClientIp(req)
    next(applicationError)
  })
}

module.exports = {
  router
}
