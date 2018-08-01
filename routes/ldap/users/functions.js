const database = require('../../../configs/database')
const ApplicationErrorClass = require('../../applicationErrorClass')
const functionsUser = require('../../../routes/user/user/function')
const async = require('async')
const config = require('../../../configs/config')
const ldapFunctions = require('../../ldapFunctions')

let ldapMain = config.LDAP_CLIENT

function buildTokenAndMakeEntryForActivation (user) {
  return new Promise(
    function (resolve, reject) {
      let token = functionsUser.buildToken()
      let tmpUser = new database.UserRegMailToken({
        uid: user.uid,
        dn: user.dn,
        scope: user.eduPersonScopedAffiliation,
        mail: user.mail,
        token: token
      })
      tmpUser.save(function (err, user) {
        if (err) {
          reject(new ApplicationErrorClass(null, null, 58, err, 'Συνέβη κάποιο σφάλμα κατα την δημιουργία token', null, 500))
        } else {
          resolve(user)
        }
      })
    })
}

function sendActivationMailToAllUsers (userIDs) {
  return new Promise(
    function (resolve, reject) {
      let calls = []

      userIDs.forEach(function (userID) {
        calls.push(function (callback) {
          let options = ldapFunctions.buildOptions('(id=' + userID + ')', 'sub', []) //check if this is the correct id
          ldapFunctions.searchUserOnLDAP(ldapMain, options).then(user => {
            if (user.dn) {
              return buildTokenAndMakeEntryForActivation(user)
            }
          }).then(user => {
            if (user) {
              let mailToken = functionsUser.buildEmailToken(user, user.token, 'Activation')
              return functionsUser.sendEmailToken(mailToken)
            }
          }).then(() => {
            callback(null)
          }).catch(function (error) {
            reject(new ApplicationErrorClass('sendActivationMail', null, 98, error, 'Συνέβη κάποιο σφάλμα κατά την αποστολή mail', null, 500))
          })
        })
      })

      async.parallel(calls, function (err) {
        if (err) {
          reject(new ApplicationErrorClass('sendActivationMail', null, 99, err, 'Συνέβη κάποιο σφάλμα κατά την αποστολή mail', null, 500))
        } else {
          resolve()
        }
      })
    })
}

module.exports = {
  sendActivationMailToAllUsers
}