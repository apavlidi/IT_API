/* eslint-disable new-cap */

const PromiseError = require('../promiseErrorClass')
const database = require('../../configs/database')
const config = require('../../configs/config')
const crypt = require('crypt3/sync')
const ldap = require('ldapjs')
const async = require('async')
const _ = require('lodash')

function checkIfTokenExistsAndRetrieveUser (token, schema) {
  return new Promise(
    function (resolve, reject) {
      schema.findOne({token: token}).exec(function (err, userFromDatabase) {
        if (err || !userFromDatabase) {
          reject(new PromiseError(2100, err))
        } else {
          resolve(userFromDatabase)
        }
      })
    })
}

function checkPassword (owasp, password) {
  return new Promise(
    function (resolve, reject) {
      let result = owasp.test(password)
      if (result.strong || result.isPassphrase) {
        resolve()
      } else {
        reject(new PromiseError(2141, result.errors[0]))
      }
    })
}

function changePasswordLdap (ldapBinded, userDN, password) {
  return new Promise(
    function (resolve, reject) {
      let hash = crypt(password, crypt.createSalt('sha256'))
      let changePassword = new ldap.Change({
        operation: 'replace',
        modification: {
          userPassword: '{CRYPT}' + hash
        }
      })
      ldapBinded.modify(userDN, changePassword, function (err) {
        if (err) {
          reject(new PromiseError(2143, err))
        } else {
          resolve()
        }
      })
    })
}

function changeMailLdap (ldapBinded, userDn, newMail) {
  return new Promise(
    function (resolve, reject) {
      let changeMailOpts = new ldap.Change({
        operation: 'replace',
        modification: {
          mail: newMail
        }
      })
      ldapBinded.modify(userDn, changeMailOpts, function (err) {
        if (err) {
          reject(new PromiseError(2131, err))
        } else {
          resolve()
        }
      })
    })
}

function appendDatabaseInfo (users, query, req) {
  return new Promise(
    function (resolve, reject) {
      let calls = []
      users.forEach(function (user) {
        calls.push(function (callback) {
          database.Profile.findOne({ldapId: user.id}).select('profilePhoto socialMedia notySub').exec(function (err, profile) {
            if (err) {
              reject(new PromiseError(2001, err))
            } else {
              if (profile) {
                buildDataForUserFromDB(user, profile, query, req)
              }
              callback(null)
            }
          })
        })
      })

      async.parallel(calls, function (err) {
        if (err) {
          reject(new PromiseError(2002, err))
        } else {
          resolve(users)
        }
      })
    })
}

function buildDataForUserFromDB (user, profile, query, req) {
  if (query.fields) {
    if (_.includes(query.fields, 'socialMedia')) {
      user['socialMedia'] = profile.socialMedia
    }
    if (_.includes(query.fields, 'profilePhoto')) {
      if (profile.profilePhoto && profile.profilePhoto.data) {
        // user['profilePhoto'] = 'data:' + profile.profilePhoto.contentType + ';base64,' + new Buffer.from(profile.profilePhoto.data, 'base64').toString('binary')
        user['profilePhoto'] = config.WEB_BASE_URL.url+'/user/image/' + user.id
      } else {
        user['profilePhoto'] = ''
      }
    }
  } else {
    user['socialMedia'] = profile.socialMedia
    if (profile.profilePhoto && profile.profilePhoto.data) {
      // user['profilePhoto'] = 'data:' + profile.profilePhoto.contentType + ';base64,' + new Buffer.from(profile.profilePhoto.data, 'base64').toString('binary')
      user['profilePhoto'] = config.WEB_BASE_URL.url+'/user/image/' + user.id
    } else {
      user['profilePhoto'] = ''
    }
  }
  return user
}

function buildFieldsQueryLdap (attributesPermitted, query) {
  let filterAttr = ['id'] // this needs in order to return always id

  if (Object.prototype.hasOwnProperty.call(query, 'fields')) {
    let fields = query.fields.split(',')

    if (attributesPermitted.length === 0) {
      fields.forEach(field => {
        filterAttr.push(field)
      })
    } else {
      fields.forEach(field => {
        if (attributesPermitted.indexOf(field) > -1) {
          filterAttr.push(field)
        }
      })
    }

    return filterAttr
  } else {
    return attributesPermitted
  }
}

module.exports = {
  checkPassword,
  changePasswordLdap,
  changeMailLdap,
  checkIfTokenExistsAndRetrieveUser,
  appendDatabaseInfo,
  buildFieldsQueryLdap
}
