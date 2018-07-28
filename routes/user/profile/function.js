const database = require('../../../configs/database')
const ldap = require('ldapjs')
const ApplicationErrorClass = require('./../../applicationErrorClass')
const config = require('../../../configs/config')
const ldapFunction = require('./../../../configs/ldap')
const ldapConfig = require('../../../configs/ldap')
const _ = require('lodash')
const async = require('async')

function updatePhotoProfileIfNecessary (user, files) {
  return new Promise(
    function (resolve, reject) {
      if (files && user.eduPersonScopedAffiliation >= config.PERMISSIONS.professor) {
        let profilePhoto = files['profilePhoto']
        if (photoTypeIsValid(profilePhoto)) {
          database.Profile.findOneAndUpdate({ldapId: user.id}, {
            'profilePhoto.contentType': profilePhoto.mimetype,
            'profilePhoto.data': new Buffer(profilePhoto.data).toString('base64')
          }, function (err, result) {
            if (err) {
              reject(new ApplicationErrorClass('updatePublicProfile', null, 68, err, 'Κάποιο σφάλμα δημιουργήθηκε κατα την αποθήκευση δεδομένων', null, 500))
            }
            resolve()
          })
        } else {
          reject(new ApplicationErrorClass('updatePublicProfile', null, 68, null, 'Ο τύπος αρχειου δν υποστηρίζεται', null, 500))
        }
      } else {
        resolve()
      }
    })
}

function photoTypeIsValid (photo) {
  return (photo.mimetype == 'image/png' || photo.mimetype == 'image/jpeg' || photo.mimetype == 'image/bmp')
}

function updateSocialMediaIfNecessary (userId, reqBody) {
  return new Promise(
    function (resolve, reject) {
      updateCoreSocialMediaIfNecessary(userId, reqBody).then(() => {
        updateExtraSocialMediaIfNecessary(userId, reqBody.socialMediaExtra).then(() => {
          resolve()
        })
      }).catch(function (applicationError) {
        reject(applicationError)
      })
    })
}

function updateCoreSocialMediaIfNecessary (ldapId, reqBody) {
  return new Promise(
    function (resolve, reject) {
      database.Profile.findOne({ldapId: ldapId}, function (err, profile) {
        if (_.has(reqBody, 'facebook')) {
          profile.socialMedia.facebook = reqBody['facebook']
        }
        if (_.has(reqBody, 'twitter')) {
          profile.socialMedia.twitter = reqBody['twitter']
        }
        if (_.has(reqBody, 'github')) {
          profile.socialMedia.github = reqBody['github']
        }
        if (_.has(reqBody, 'googlePlus')) {
          profile.socialMedia.googlePlus = reqBody['googlePlus']
        }
        if (_.has(reqBody, 'linkedIn')) {
          profile.socialMedia.linkedIn = reqBody['linkedIn']
        }
        profile.save(function (err) {
          if (err) {
            reject(new ApplicationErrorClass('updatePublicProfile', null, 68, err, 'Κάποιο σφάλμα δημιουργήθηκε κατα την αποθήκευση δεδομένων', null, 500))
          } else {
            resolve()
          }
        })
      })
    })
}

function updateExtraSocialMediaIfNecessary (ldapId, socialMediaExtras) {
  return new Promise(
    function (resolve, reject) {
      let socialMediaExtra
      try {
        socialMediaExtra = JSON.parse(socialMediaExtras)
      } catch (err) {
        reject(new ApplicationErrorClass('updatePublicProfile', null, 70, err, 'Λάθος εισαγωγή δεδομένων', null, 500))
      }
      database.Profile.findOne({ldapId: ldapId}, function (err, profile) {
        if (err || !profile) {
          reject(new ApplicationErrorClass('updatePublicProfile', null, 69, err, 'Το προφιλ δεν υπάρχει', null, 500))
        }

        socialMediaExtra.forEach(function (value) {
          if (value.name && value.url) {
            if (extraSocialMediaExistsInProfile(profile, value)) {
              findSocialMediaPosAndUpdate(profile, value)
            } else {
              profile.socialMedia.socialMediaExtra.push(value)
            }
          }
        })
        profile.save(function (err) {
          if (err) {
            reject(new ApplicationErrorClass('updatePublicProfile', null, 68, err, 'Κάποιο σφάλμα δημιουργήθηκε κατα την αποθήκευση δεδομένων', null, 500))
          } else {
            resolve()
          }
        })
      })
    })
}

function findSocialMediaPosAndUpdate (profile, value) {
  let elementPos = profile.socialMedia.socialMediaExtra.findIndex(x => x._id == value._id)
  if (value.name && value.url && elementPos >= 0) {
    profile.socialMedia.socialMediaExtra[elementPos].name = value.name
    profile.socialMedia.socialMediaExtra[elementPos].url = value.url
  } else {
    profile.socialMedia.socialMediaExtra.splice(elementPos, 1)
  }
}

function extraSocialMediaExistsInProfile (profile, extraSocialMedia) {
  return profile.socialMedia.socialMediaExtra.find(function (ele) {
    return ele._id == extraSocialMedia._id
  })
}

function modifyAttributesOnLDAP (ldapMain, dataProfile, userDN) {
  return new Promise(
    function (resolve, reject) {
      modifyDataProfileInput(dataProfile)
      for (let attribute of Object.keys(dataProfile)) {
        if (_.includes(ldapConfig.PERMITTED_FIELDS_TO_MODIFY_IN_PROFILE, attribute)) {
          let tmpMod = {
            operation: 'replace',
            modification: {}
          }
          tmpMod.modification[attribute] = dataProfile[attribute]
          let change = new ldap.Change(tmpMod)
          ldapMain.modify(userDN, change, function (err) {
            if (err) {
              reject(new ApplicationErrorClass('updatePublicProfile', null, 65, err, 'Κάποιο σφάλμα δημιουργήθηκε κατα την αποθήκευση πεδίων.', null, 500))
            }
          })
        }
      }
      resolve()
    })
}

function modifyDataProfileInput (dataProfile) {
  if (dataProfile['displayName;lang-el']) {
    let displayNameEl = dataProfile['displayName;lang-el']
    dataProfile.displayName = ldapFunction.elotTranslate(displayNameEl)
  }
  if (dataProfile['scientificField']) {
    dataProfile.eduPersonEntitlement = dataProfile['scientificField']
  }
  if (dataProfile['telephoneNumber']) {
    let numberPattern = /\d+/g
    if (!dataProfile['telephoneNumber'].match(numberPattern)) {
      dataProfile['telephoneNumber'] = '-'
    }
  }
  if (dataProfile['description;lang-el']) {
    dataProfile['description;lang-el'].substring(0, 1000)
  }
  if (dataProfile['description']) {
    dataProfile['description'].substring(0, 1000)
  }
}

module.exports = {
  updateSocialMediaIfNecessary,
  updatePhotoProfileIfNecessary,
  modifyAttributesOnLDAP
}