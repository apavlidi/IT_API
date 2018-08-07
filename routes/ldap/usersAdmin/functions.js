const async = require('async')
const fs = require('fs')
const path = require('path')
const readLine = require('readline')
const Joi = require('joi')
const ldap = require('ldapjs')

const database = require('../../../configs/database')
const ApplicationErrorClass = require('../../applicationErrorClass')
const functionsUser = require('../../../routes/user/user/function')
const config = require('../../../configs/config')
const ldapFunctions = require('../../ldapFunctions')
const functionLdapUser = require('./../userAdmin/functions')
const validSchemas = require('./../userAdmin/joi')

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
          reject(new ApplicationErrorClass(null, null, 3411, err, 'Συνέβη κάποιο σφάλμα κατα την δημιουργία token', null, 500))
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
            reject(new ApplicationErrorClass('sendActivationMail', null, 3412, error, 'Συνέβη κάποιο σφάλμα κατά την αποστολή mail', null, 500))
          })
        })
      })

      async.parallel(calls, function (err) {
        if (err) {
          reject(new ApplicationErrorClass('sendActivationMail', null, 3413, err, 'Συνέβη κάποιο σφάλμα κατά την αποστολή mail', null, 500))
        } else {
          resolve()
        }
      })
    })
}

function fileMimeTypeIsValid (file) {
  return file.mimetype == 'text/plain'
}

function saveFileToPath (file) {
  return new Promise(
    function (resolve, reject) {
      let uploadDir = path.join(__dirname, 'uploads')
      let date = new Date()
      let dateString = date.toLocaleDateString()
      let fileName = 'users_' + dateString + '.txt'
      let fileFullPath = path.join(uploadDir, fileName)
      file.mv(fileFullPath, function (err) {
        if (err) {
          reject(new ApplicationErrorClass(null, null, 3421, err, 'Συνέβη κάποιο σφάλμα κατα την αποθήκευση αρχείου', null, 500))
        } else {
          resolve(fileFullPath)
        }
      })
    })
}

function createUserByLines (fileFullPath, reqBody) {
  return new Promise(
    function (resolve, reject) {
      let users = []

      let lineReader = readLine.createInterface({
        input: fs.createReadStream(fileFullPath)
      })

      lineReader.on('line', function (line) {
        if (validColsOnLine(line)) {
          let cols = line.split('\t')
          let user = buildUser(reqBody, cols)
          if (user) {
            Joi.validate(user, validSchemas.initializeUser).then(userInitialized => {
              users.push(userInitialized)
            })
          }
        } else {
          reject(new ApplicationErrorClass('importUpdateUsers', null, 3423, null, 'Σφάλμα κατα την ανάγνωση του αρχείου', null, 500))
        }
      })

      lineReader.on('close', function (err) {
        if (err) {
          reject(new ApplicationErrorClass('importUpdateUsers', null, 3424, null, 'Σφάλμα κατα την ανάγνωση του αρχείου', null, 500))
        } else {
          resolve(users)
        }
      })
    })
}

//TODO ERROR APPLICATION
function importUsers (users) {
  return new Promise(
    function (resolve, reject) {
      let calls = []
      let results = []
      global.importInProgress = true

      ldapFunctions.bindLdap(ldapMain).then(ldapBinded => {
        users.forEach(user => {
          calls.push(function (callback) {
            importUser(user, ldapBinded).then(result => {
              results.push(result)
              callback(null)
            })
          })
        })

        async.parallel(calls, function (err) {
          if (err) {
            reject(err)
          }
          resolve(results)
        })
      })
    })

}

//TODO THERE IS A COMMENT THAT NEEDS TO BE IMPLEMENTED ABOUT REMOVING PROFILE
function importUser (user, ldapBinded) {
  return new Promise(
    function (resolve, reject) {
      functionLdapUser.checkIfUserExists(ldapBinded, user, user.basedn).then(result => {
        let err = result[0]

        let itEXistsAndHasSameStatus = result[1]
        if (functionLdapUser.doesNotExist(err, user.status)) {
          functionLdapUser.createUser(ldapBinded, user).then(() => {
            resolve('Inserted')
          }).catch(function (err) {
            resolve(['Error', user.am])
          })
        } else if (itEXistsAndHasSameStatus) {
          ldapBinded.compare(functionLdapUser.ldapBaseDN(user.uid, user.basedn), 'sem', '' + user.sem, function (err, matchedSem) {
            if (matchedSem) {
              resolve('NoChange')
            } else {
              updateUserSem(ldapBinded, user, user.basedn).then(() => {
                resolve('Updated')
              }).catch(function (err) {
                resolve(['Error', user.am])
              })
            }
          })
        } else if (statusChanged(user.status)) {
          ldapBinded.compare(functionLdapUser.ldapBaseDN(user.uid, user.basedn), 'am', user.am + '', function (err, matchedStatus) {
            if (err) { //it does not exist on ldap
              resolve('NoAction')
            } else {
              updatePassword(ldapBinded, user, user.basedn).then(() => {
                return updateStatus(ldapBinded, user, user.basedn)
              }).then(() => {
                //removeDisabledFromDatabase
                resolve('Blocked')
              }).catch(function (err) {
                resolve(['Error', user.am])
              })
            }
          })
        } else { //he was deactivated and became activated
          updateScope(ldapBinded, user, user.basedn).then(() => {
            return updateStatus(ldapBinded, user, user.basedn)
          }).then(() => {
            resolve('Updated')
          }).catch(function (err) {
            resolve(['Error', user.am])
          })
        }
      })
    })

}

function updateScope (ldapBinded, newUser, basedn) {
  return new Promise(
    function (resolve, reject) {
      let updateScope = new ldap.Change({ //to give user access into activate page
        operation: 'replace',
        modification: {
          eduPersonScopedAffiliation: 0
        }
      })
      ldapBinded.modify(ldapBaseDN(newUser.uid, basedn), updateScope, function (err) {
        if (err) {
          reject(new ApplicationErrorClass('addUser', null, 80, err, 'Συνέβη κάποιο σφάλμα κατα την δημιουργία χρήστη', null, 500))
        } else {
          resolve()
        }
      })
    })
}

const ldapBaseDN = (uid, basedn) => {
  return 'uid=' + uid + ',' + basedn
}

function updateStatus (ldapBinded, newUser, basedn) {
  return new Promise(
    function (resolve, reject) {
      let updateStatus = new ldap.Change({
        operation: 'replace',
        modification: {
          status: newUser.status
        }
      })
      ldapBinded.modify(ldapBaseDN(newUser.uid, basedn), updateStatus, function (err) {
        if (err) {
          reject(new ApplicationErrorClass('addUser', null, 81, err, 'Συνέβη κάποιο σφάλμα κατα την δημιουργία χρήστη', null, 500))
        } else {
          resolve()
        }
      })
    })
}

function updatePassword (ldapBinded, newUser, basedn) {
  return new Promise(
    function (resolve, reject) {
      let updatePassword = new ldap.Change({
        operation: 'replace',
        modification: {
          userPassword: newUser.userPassword
        }
      })
      ldapBinded.modify(ldapBaseDN(newUser.uid, basedn), updatePassword, function (err) {
        if (err) {
          reject(new ApplicationErrorClass('addUser', null, 81, err, 'Συνέβη κάποιο σφάλμα κατα την δημιουργία χρήστη', null, 500))
        } else {
          resolve()
        }
      })
    })
}

function statusChanged (status) {
  return status != 1
}

function updateUserSem (ldapBinded, newUser, basedn) {
  return new Promise(
    function (resolve, reject) {
      let updateSem = new ldap.Change({
        operation: 'replace',
        modification: {
          sem: newUser.sem
        }
      })
      ldapBinded.modify(functionLdapUser.ldapBaseDN(newUser.uid, basedn), updateSem, function (err) {
        if (err) {
          reject(new ApplicationErrorClass('addUser', null, 82, err, 'Συνέβη κάποιο σφάλμα κατα την δημιουργία χρήστη', null, 500))
        } else {
          resolve()
        }
      })
    })
}

function buildResults (fileName, results) {
  let statistics = {
    fileName: fileName,
    endTime: '',
    found: 0,
    inserted: 0,
    updated: 0,
    blocked: 0,
    nochange: 0,
    noaction: 0,
    errors: []
  }
  statistics.found = results.length
  results.forEach(result => {
    switch (result) {
      case 'Inserted':
        statistics.inserted++
        break
      case 'Updated':
        statistics.updated++
        break
      case 'NoChange':
        statistics.nochange++
        break
      case 'NoAction':
        statistics.noaction++
        break
      case 'Blocked':
        statistics.blocked++
        break
      default:
        statistics.errors.push(result)
    }
  })
  return statistics
}

function buildUser (reqBody, cols) {
  if (cols[0].indexOf('student_ID') < 1) {
    let user
    let status = cols[7]
    let fathersname = cols[4]
    let eduPersonAffiliation = reqBody.type
    let primaryAffiliation = reqBody.typeP
    let gidNumber = reqBody.gid //get it from html
    let basedn = reqBody.basedn
    let title = reqBody.title
    let titleGr = reqBody.titleGr
    if (fathersname === '') {
      fathersname = '-'
    }
    user = {
      uid: primaryAffiliation + cols[1].replace(/\W/g, ''),
      am: cols[1],
      regyear: cols[5],
      regsem: cols[6],
      sem: cols[10],
      'givenName;lang-el': cols[2],
      'sn;lang-el': cols[3],
      'fathersname;lang-el': fathersname,
      eduPersonAffiliation: eduPersonAffiliation,
      eduPersonPrimaryAffiliation: primaryAffiliation,
      eduPersonScopedAffiliation: 0,
      mail: 'nomail@it.teithe.gr',
      status: status,
      userPassword: '{CRYPT}TSMywqBza/y3A',
      gidNumber: gidNumber,
      loginShell: '/bin/bash',
      basedn: basedn,
      title: title,
      'title;lang-el': titleGr
    }
    return user
  }
}

function validColsOnLine (line) {
  let valid = true
  let cols = line.split('\t')
  if (cols.length !== 11) {
    valid = false
  }
  return valid
}

module.exports = {
  sendActivationMailToAllUsers,
  fileMimeTypeIsValid,
  saveFileToPath,
  createUserByLines,
  importUsers,
  buildResults
}