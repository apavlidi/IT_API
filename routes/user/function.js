const ApplicationErrorClass = require('../applicationErrorClass')
const config = require('../../configs/config')
const database = require('../../configs/database')
const crypt = require('crypt3/sync')
const ldap = require('ldapjs')

function bindLdap (ldapMain) {
  return new Promise(
    function (resolve, reject) {
      ldapMain.bind(config.LDAP[process.env.NODE_ENV].user, config.LDAP[process.env.NODE_ENV].password, function (err) {
        if (err) {
          reject(new ApplicationErrorClass(null, null, 38, err, 'Παρακαλώ δοκιμάστε αργότερα', null, 500))
        } else {
          resolve(ldapMain)
        }
      })
    })
}

function buildOptions (filter, scope, attributes) {
  return {
    filter: filter,
    scope: scope,
    attributes: attributes
  }
}

function checkIfTokenExistsAndRetrieveUser (token,schema) {
  return new Promise(
    function (resolve, reject) {
      schema.findOne({token: token}).exec(function (err, userFromDatabase) {
        if (err || !userFromDatabase) {
          reject(new ApplicationErrorClass(null, null, 41, err, 'Το token είναι λάθος', null, 500))
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
        reject(new ApplicationErrorClass(null, null, 40, result.errors[0], 'Υπήρχε σφάλμα στον κωδικό', null, 500)
        )
      }
    })
}

function searchUserOnLDAP (ldap, options) {
  return new Promise(
    function (resolve, reject) {
      let user = {}
      ldap.search(config.LDAP[process.env.NODE_ENV].baseUserDN, options, function (err, results) {
        results.on('searchEntry', function (entry) {
          user = entry.object
        })
        results.on('error', function (err) {
          reject(new ApplicationErrorClass(null, null, 32, err, 'Παρακαλώ δοκιμάστε αργότερα', null, 500))
        })
        results.on('end', function (result) {
          resolve(user)
        })
      })
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
          reject(new ApplicationErrorClass(null, null, 43, err, 'Υπήρχε σφάλμα κατα την αλλαγή κωδικού', null, 500))
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
          reject(new ApplicationErrorClass(null, null, 39, err, 'Η αλλαγή email απέτυχε.Παρακαλώ δοκιμάστε αργότερα.', null, 500))
        } else {
          resolve()
        }
      })
    })
}


module.exports = {
  bindLdap,
  buildOptions,
  searchUserOnLDAP,
  checkPassword,
  changePasswordLdap,
  changeMailLdap,
  checkIfTokenExistsAndRetrieveUser,

}
