var express = require('express')
var router = express.Router()

const apiFunctions = require('./../../apiFunctions')
const functionsUser = require('../functionsUser')
const functions = require('./function')
const auth = require('../../../configs/auth')
const config = require('../../../configs/config')
let ldapMain = config.LDAP_CLIENT
const filter = require('ldap-filters')
const ldapFunction = require('./../../../configs/ldap')
const database = require('../../../configs/database')

router.get('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), getUserProfile)
router.patch('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), updatePublicProfile)
router.delete('/photo', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), deleteProfilePhoto)

function deleteProfilePhoto (req, res, next) {
  database.Profile.findOneAndUpdate({ldapId: req.user.id}, {
    'profilePhoto': {},
  }, function (err, profile) {
    if (err || !profile) {
      next(new ApplicationErrorClass('deleteProfilePhoto', req.user.id, 78, null, 'Συνέβη κάποιο σφάλμα κατα την διαγραφή φωτογραφίας προφιλ', apiFunctions.getClientIp(req), 500))
    } else {
      res.sendStatus(200)
    }
  })
}

function updatePublicProfile (req, res, next) {
  let dataProfile = req.body
  let ldapBinded = null
  functions.updatePhotoProfile(req.user, req.files).then(() => {
    return functions.updateSocialMedia(req.user.id, req.body)
  }).then(() => {
    return functionsUser.bindLdap(ldapMain)
  }).then(ldapMainBinded => {
    ldapBinded = ldapMainBinded
    let output = filter.AND([filter.attribute('id').equalTo(req.user.id)])
    let opts = functionsUser.buildOptions(output.toString(), 'sub', 'id')
    return functionsUser.searchUserOnLDAP(ldapBinded, opts)
  }).then(user => {
    let displayNameEl = dataProfile['displayName;lang-el']
    if (displayNameEl) {
      dataProfile.displayName = ldapFunction.elotTranslate(displayNameEl)
    }
    dataProfile.description.substring(0, 1000)
    dataProfile['description;lang-el'].substring(0, 1000)
    return functions.modifyAttributesOnLDAP(ldapBinded, dataProfile, user.dn)
  }).then(() => {
    res.sendStatus(200)
  })
}

function getUserProfile (req, res, next) {
  let opts = functionsUser.buildOptions('(id=' + req.user.id + ')', 'sub', functionsUser.buildFieldsQueryLdap(['am', 'description', 'eduPersonEntitlement', 'pwdChangedTime', 'displayName', 'regyear', 'regsem', 'sem', 'givenName', 'sn', 'fathersname', 'cn', 'secondarymail', 'mail', 'eduPersonAffiliation', 'eduPersonPrimaryAffiliation', 'title', 'telephoneNumber', 'labeledURI'], req.query))
  functionsUser.searchUserOnLDAP(ldapMain, opts).then(user => {
    delete user.controls
    delete user.dn
    return functionsUser.appendDatabaseInfo([user], req.query)
  }).then(user => {
    res.status(200).json(user[0])
  }).catch(function (applicationError) {
    applicationError.type = 'getUserProfile'
    applicationError.ip = apiFunctions.getClientIp(req)
    next(applicationError)
  })
}

module.exports = {
  router
}
