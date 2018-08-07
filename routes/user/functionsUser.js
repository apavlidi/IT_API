const ApplicationErrorClass = require('../applicationErrorClass')
const database = require('../../configs/database')
const crypt = require('crypt3/sync')
const ldap = require('ldapjs')
const async = require('async')
const _ = require('lodash')

function checkIfTokenExistsAndRetrieveUser (token, schema) {
  return new Promise(
    function (resolve, reject) {
      schema.findOne({token: token}).exec(function (err, userFromDatabase) {
        if (err || !userFromDatabase) {
          reject(new ApplicationErrorClass(null, null, 2100, err, 'Το token είναι λάθος', null, 500))
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
        reject(new ApplicationErrorClass(null, null, 2141, result.errors[0], 'Υπήρχε σφάλμα στον κωδικό', null, 500)
        )
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
          reject(new ApplicationErrorClass(null, null, 2143, err, 'Υπήρχε σφάλμα κατα την αλλαγή κωδικού', null, 500))
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
          reject(new ApplicationErrorClass(null, null, 2131, err, 'Η αλλαγή email απέτυχε.Παρακαλώ δοκιμάστε αργότερα.', null, 500))
        } else {
          resolve()
        }
      })
    })
}

function appendDatabaseInfo (users, query) {
  return new Promise(
    function (resolve, reject) {
      let calls = []
      users.forEach(function (user) {
        calls.push(function (callback) {
          database.Profile.findOne({ldapId: user.id}).select('profilePhoto socialMedia notySub').exec(function (err, profile) {
            if (err) {
              reject(new ApplicationErrorClass(null, null, 2001, err, 'Κάποιο σφάλμα συνέβη.', null, 500))
            } else {
              if (profile) {
                buildDataForUserFromDB(user, profile, query)
              }
              callback(null)
            }
          })
        })
      })

      async.parallel(calls, function (err) {
        if (err) {
          reject(new ApplicationErrorClass('updateMailReg', null, 2002, err, 'Παρακαλώ δοκιμάστε αργότερα', null, 500))
        } else {
          resolve(users)
        }
      })
    })
}

function buildDataForUserFromDB (user, profile, query) {
  if (query.fields) {
    if (_.includes(query.fields, 'socialMedia')) {
      user['socialMedia'] = profile.socialMedia
    }
    if (_.includes(query.fields, 'profilePhoto')) {
      if (profile.profilePhoto && profile.profilePhoto.data) {
        user['profilePhoto'] = 'data:' + profile.profilePhoto.contentType + ';base64,' + new Buffer(profile.profilePhoto.data, 'base64').toString('binary')
      } else {
        user['profilePhoto'] = ''
      }
    }
  } else {
    user['socialMedia'] = profile.socialMedia
    if (profile.profilePhoto && profile.profilePhoto.data) {
      user['profilePhoto'] = 'data:' + profile.profilePhoto.contentType + ';base64,' + new Buffer(profile.profilePhoto.data, 'base64').toString('binary')
    } else {
      user['profilePhoto'] = ''
    }
  }
  return user
}

function buildFieldsQueryLdap (attributesPermitted, query) {
  let filterAttr = ['id'] //this needs in order to return always id

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
