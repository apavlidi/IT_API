const PromiseError = require('../../promiseErrorClass')
const config = require('../../../configs/config')
const database = require('../../../configs/database')
const ldap = require('ldapjs')

function validateUserAndPassOnPithia (ldapBind, user, password) {
  return new Promise(
    function (resolve, reject) {
      if (user.dn) {
        ldapBind.bind(user.dn, password, function (err) {
          if (err) {
            reject(new PromiseError(2113, err))
          } else {
            resolve()
          }
        })
      } else {
        reject(new PromiseError(2114, null))
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
          reject(new PromiseError(2142, err))
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
          reject(new PromiseError(2144, err))
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
