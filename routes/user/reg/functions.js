const ApplicationErrorClass = require('../../applicationErrorClass')
const config = require('../../../configs/config')
const database = require('../../../configs/database')
const crypt = require('crypt3/sync')
const ldap = require('ldapjs')

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


function changeScopeLdap (ldapMainBinded, userDN, userScope) {
  return new Promise(
    function (resolve, reject) {
      let scope = (userScope === 0) ? config.SCOPE_ACTIVATED : userScope

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

function deleteRegToken (token) {
  return new Promise(
    function (resolve, reject) {
      database.UserReg.findOneAndRemove({token: token}).exec(function (err) {
        if (err) {
          reject(new ApplicationErrorClass(null, null, 44, err, 'Υπήρχε σφάλμα κατα την εύρεση token.', null, 500))
        } else {
          resolve()
        }
      })
    })
}

module.exports = {
  validateUserAndPassOnPithia,
  changeScopeLdap,
  deleteRegToken
}