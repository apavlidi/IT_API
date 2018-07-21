const database = require('../../../configs/database')
const ldap = require('ldapjs')
const ApplicationErrorClass = require('./../../applicationErrorClass')

function updatePhotoProfile (user, files) {
  return new Promise(
    function (resolve, reject) {
      if (files && user.scope >= 2) {
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
          reject(new ApplicationErrorClass('updatePublicProfile', null, 68, err, 'Ο τύπος αρχειου δν υποστηρίζεται', null, 500))
        }
      } else {
        resolve()
      }
    })
}

function photoTypeIsValid (photo) {
  return photo.mimetype != 'image/png' && photo.mimetype != 'image/jpeg' && photo.mimetype != 'image/bmp'
}

function updateSocialMedia (userId, reqBody) {
  return new Promise(
    function (resolve, reject) {
      let socialMediaExtra
      try {
        socialMediaExtra = JSON.parse(reqBody.socialMediaExtra)
      } catch (err) {
        reject(new ApplicationErrorClass('updatePublicProfile', null, 70, err, 'Λάθος εισαγωγή δεδομένων', null, 500))
      }
      database.Profile.findOne({ldapId: userId}, function (err, profile) {
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
          }
          database.Profile.findOneAndUpdate({ldapId: userId}, {
            'socialMedia.facebook': reqBody.facebook,
            'socialMedia.twitter': reqBody.twitter,
            'socialMedia.github': reqBody.github,
            'socialMedia.googlePlus': reqBody.googlePlus,
            'socialMedia.linkedIn': reqBody.linkedIn
          }, function (err) {
            if (err) {
              reject(new ApplicationErrorClass('updatePublicProfile', null, 68, err, 'Κάποιο σφάλμα δημιουργήθηκε κατα την αποθήκευση δεδομένων', null, 500))
            }
            resolve()
          })
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

function fillEmptyAttributes (dataProfile, attribute) {
  if (attribute === 'telephoneNumber') {
    dataProfile[attribute] = 0
  } else {
    dataProfile[attribute] = '-'
  }
}

function modifyAttributesOnLDAP (ldapMain, dataProfile, userDN) {
  return new Promise(
    function (resolve, reject) {
      for (let attribute of Object.keys(dataProfile)) {
        if (!dataProfile[attribute]) {
          fillEmptyAttributes(dataProfile, attribute)
        } else {
          let numberPattern = /\d+/g
          if (attribute === 'telephoneNumber' && !dataProfile[attribute].match(numberPattern)) {
            dataProfile[attribute] = '-'
          }
        }
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
      resolve()
    })
}

module.exports = {
  updateSocialMedia,
  updatePhotoProfile,
  modifyAttributesOnLDAP
}