/* eslint-disable new-cap */

const database = require('../../../configs/database')
const ldap = require('ldapjs')
const PromiseError = require('../../promiseErrorClass')
const config = require('../../../configs/config')
const ldapFunction = require('./../../../configs/ldap')
const ldapConfig = require('../../../configs/ldap')
const _ = require('lodash')

function updatePhotoProfileIfNecessary (user, files) {
  return new Promise(
    function (resolve, reject) {
      if (files && user.eduPersonScopedAffiliation >= config.PERMISSIONS.professor) {
        let profilePhoto = files['profilePhoto']
        if (photoTypeIsValid(profilePhoto)) {
          database.Profile.findOneAndUpdate({ldapId: user.id}, {
            'profilePhoto.contentType': profilePhoto.mimetype,
            'profilePhoto.data': new Buffer.from(profilePhoto.data).toString('base64')
          }, function (err, result) {
            if (err) {
              reject(new PromiseError(2011, err))
            }
            resolve()
          })
        } else {
          reject(new PromiseError(2012, null))
        }
      } else {
        resolve()
      }
    })
}

function photoTypeIsValid (photo) {
  return (photo.mimetype === 'image/png' || photo.mimetype === 'image/jpeg' || photo.mimetype === 'image/bmp')
}

function updateSocialMediaIfNecessary (userId, reqBody) {
  return new Promise(
    function (resolve, reject) {
      updateCoreSocialMediaIfNecessary(userId, reqBody).then(() => {
        if (reqBody.socialMediaExtra) {
          return updateExtraSocialMediaIfNecessary(userId, reqBody.socialMediaExtra)
        } else {
          resolve()
        }
      }).then(() => {
        resolve()
      }).catch(function (promiseError) {
        reject(promiseError)
      })
    })
}

function updateCoreSocialMediaIfNecessary (ldapId, reqBody) {
  return new Promise(
    function (resolve, reject) {
      database.Profile.findOne({ldapId: ldapId}, function (err, profile) {
        if (err) {
          return reject(new PromiseError(2017, err))
        }
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
            reject(new PromiseError(2013, err))
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
        if (socialMediaExtra) {
          database.Profile.findOne({ldapId: ldapId}, function (err, profile) {
            if (err || !profile) {
              reject(new PromiseError(2015, err))
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
                reject(new PromiseError(2016, err))
              } else {
                resolve()
              }
            })
          })
        } else {
          resolve()
        }
      } catch (err) {
        return reject(new PromiseError(2014, err))
      }
    })
}

function findSocialMediaPosAndUpdate (profile, value) {
  let elementPos = profile.socialMedia.socialMediaExtra.findIndex(x => x._id === value._id)
  if (value.name && value.url && elementPos >= 0) {
    profile.socialMedia.socialMediaExtra[elementPos].name = value.name
    profile.socialMedia.socialMediaExtra[elementPos].url = value.url
  } else {
    profile.socialMedia.socialMediaExtra.splice(elementPos, 1)
  }
}

function extraSocialMediaExistsInProfile (profile, extraSocialMedia) {
  return profile.socialMedia.socialMediaExtra.find(function (ele) {
    return ele._id === extraSocialMedia._id
  })
}

function modifyAttributesOnLDAPbyProfile (ldapMain, dataProfile, userDN) {
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
              reject(new PromiseError(2018, err))
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
  modifyAttributesOnLDAPbyProfile
}
