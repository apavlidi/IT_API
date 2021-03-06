const PromiseError = require('./promiseErrorClass')
const config = require('../configs/config')
const text2png = require('text2png')

function bindLdap (ldapMain) {
  return new Promise(
    function (resolve, reject) {
      ldapMain.bind(config.LDAP[process.env.NODE_ENV].user, config.LDAP[process.env.NODE_ENV].password, function (err) {
        if (err) {
          reject(new PromiseError(2017, err))
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

function searchUserOnLDAP (ldap, options) {
  return new Promise(
    function (resolve, reject) {
      let user = null
      ldap.search(config.LDAP[process.env.NODE_ENV].baseUserDN, options, function (err, results) {
        if (err) {
          reject(new PromiseError(2003, err))
        }
        results.on('searchEntry', function (entry) {
          user = entry.object
        })
        results.on('error', function (err) {
          reject(new PromiseError(2000, err))
        })
        results.on('end', function (result) {
          resolve(user)
        })
      })
    })
}

function searchUsersOnLDAP (ldapMain, opts) {
  return new Promise(
    function (resolve, reject) {
      ldapMain.search(config.LDAP[process.env.NODE_ENV].baseUserDN, opts, function (err, results) {
        if (err) {
          reject(new PromiseError(3400, err))
        } else {
          let usersArray = []
          let userCounter = 0
          results.on('searchEntry', function (user) {
            addUserToArray(user.object, userCounter++, usersArray)
          })

          results.on('error', function (err) {
            (err.code === 4) ? resolve(usersArray)
              : reject(new PromiseError(3401, err))
          })
          results.on('end', function (result) {
            resolve(usersArray)
          })
        }
      })
    })
}

function addUserToArray (user, userCounter, usersArray) {
  let tmp = user
  delete tmp.dn
  delete tmp.controls
  tmp.serNumber = userCounter
  if (user.secondarymail) {
    tmp.secondarymail = text2png(user.secondarymail, {
      font: '14px Futura',
      textColor: 'black',
      bgColor: 'white',
      lineSpacing: 1,
      padding: 1,
      output: 'dataURL'
    })
  }
  usersArray.push(tmp)
}

module.exports = {
  bindLdap,
  buildOptions,
  searchUserOnLDAP,
  searchUsersOnLDAP
}
