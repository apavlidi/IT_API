const ApplicationErrorClass = require('../../applicationErrorClass')
const config = require('../../../configs/config')
const database = require('../../../configs/database')
const crypt = require('crypt3/sync');
const ldap = require('ldapjs');

function buildOptions (filter, scope, attributes) {
  return {
    filter: filter,
    scope: scope,
    attributes: attributes
  }
}

function validateUserAndPassOnPithia (ldapBind, user, password) {
  return new Promise(
    function (resolve, reject) {
      if (user.dn) {
        ldapBind.bind(user.dn, password, function (err) {
          if (err) {
            reject(new ApplicationErrorClass('pauth', null, 33, null, 'Λάθος όνομα χρήστη η κωδικός.(Παρακαλώ δοκιμάστε και με τα στοιχεία του moodle)', null, 500))
          }
          else {
            resolve()
          }
        })
      } else {
        reject(new ApplicationErrorClass('pauth', null, 34, null, 'Λάθος όνομα χρήστη η κωδικός.(Παρακαλώ δοκιμάστε και με τα στοιχεία του moodle)', null, 500))
      }
    })
}

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

function checkIfTokenExistsAndRetrieveUser (token) {
  return new Promise(
    function (resolve, reject) {
      database.UserReg.findOne({token: token}).exec(function (err, userFromDatabase) {
        if (err || !userFromDatabase) {
          reject(new ApplicationErrorClass(null, null, 41, err, 'Το token είναι λάθος', null, 500))
        } else {
          resolve(userFromDatabase)
        }
      })
    })
}

function checkPassword (owasp,password) {
  return new Promise(
    function (resolve, reject) {
      let result = owasp.test(password)
      if (result.strong || result.isPassphrase) {
        resolve()
      } else {
        console.log(result.errors[0])
        reject(new ApplicationErrorClass(null, null, 40, err, 'Υπήρχε σφάλμα στον κωδικό', null, 500)
        )
      }
    })
}

function changePasswordLdap (ldapMainBinded, userDN, password) {
  return new Promise(
    function (resolve, reject) {

      let hash = crypt(password, crypt.createSalt('sha256'))
      let changePassword = new ldap.Change({
        operation: 'replace',
        modification: {
          userPassword: '{CRYPT}' + hash
        }
      })
      console.log(hash)
      console.log(userDN)
      ldapMainBinded.modify(userDN, changePassword, function (err) {
        if (err) {
          reject(new ApplicationErrorClass(null, null, 43, err, 'Υπήρχε σφάλμα κατα την αλλαγή κωδικού', null, 500))
        } else {
          resolve()

        }
      })
    })
}

function changeScopeLdap (ldapMainBinded, userDN) {
  return new Promise(
    function (resolve, reject) {
      let scope = config.SCOPE_ACTIVATED

      let changeScope = new ldap.Change({
        operation: 'replace',
        modification: {
          eduPersonScopedAffiliation: scope
        }
      })
      ldapMainBinded.modify(userDN, changeScope, function (err) {
        if (err) {
          reject(new ApplicationErrorClass(null, null, 42, err, 'Υπήρχε σφάλμα κατα την ενεργοποίηση λογαριασμού', null, 500))
        } else {
          resolve()
        }
      })
    })

}

module.exports = {
  buildOptions,
  validateUserAndPassOnPithia,
  bindLdap,
  checkIfTokenExistsAndRetrieveUser,
  checkPassword,
  changeScopeLdap,
  changePasswordLdap
}