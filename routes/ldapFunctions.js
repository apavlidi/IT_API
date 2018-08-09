const ApplicationErrorClass = require('./applicationErrorClass')
const config = require('../configs/config')
const text2png = require('text2png')

function bindLdap (ldapMain) {
  return new Promise(
    function (resolve, reject) {
      ldapMain.bind(config.LDAP[process.env.NODE_ENV].user, config.LDAP[process.env.NODE_ENV].password, function (err) {
        if (err) {
          reject(new ApplicationErrorClass(null, null, 2017, err, 'Παρακαλώ δοκιμάστε αργότερα', null, 500))
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
        results.on('searchEntry', function (entry) {
          user = entry.object
        })
        results.on('error', function (err) {
          reject(new ApplicationErrorClass(null, null, 2000, err, 'Παρακαλώ δοκιμάστε αργότερα', null, 500))
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
          reject(new ApplicationErrorClass(null, null, 3400, err, 'Παρακαλώ δοκιμάστε αργότερα', null, 500))
        } else {
          let usersArray = []
          let userCounter = 0
          results.on('searchEntry', function (user) {
            addUserToArray(user.object, userCounter++, usersArray)
          })

          results.on('error', function (err) {
            (err.code === 4) ? resolve(usersArray) :
              reject(new ApplicationErrorClass(null, null, 3400, err, 'Παρακαλώ δοκιμάστε αργότερα', null, 500))
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
