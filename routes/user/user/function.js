const crypt = require('crypt3/sync')
const crypto = require('crypto')
const async = require('async')
const filter = require('ldap-filters')
const text2png = require('text2png')

const mailTexts = require('./../../../configs/mailText')
const config = require('../../../configs/config')
const database = require('../../../configs/database')
const ApplicationErrorClass = require('../../applicationErrorClass')

const INTEGER_FIELDS = require('./../../../configs/ldap').INTEGER_FIELDS

function passwordsAreDifferent (password1, password2) {
  return password1 !== password2
}

function deleteResetToken (token) {
  return new Promise(
    function (resolve, reject) {
      database.UserPassReset.findOneAndRemove({token: token}).exec(function (err) {
        if (err) {
          reject(new ApplicationErrorClass(null, null, 56, err, 'Υπήρχε σφάλμα κατα την εύρεση token.', null, 500))
        } else {
          resolve()
        }
      })
    })
}

function passwordsAreSame (password1, password2) {
  return !passwordsAreDifferent(password1, password2)
}

function newPasswordExistsInHistory (user, password) {
  let passwordExistsInHistory = false
  if (!(user.pwdHistory instanceof Array)) { //make it function
    let tmphis = user.pwdHistory
    user.pwdHistory = []
    user.pwdHistory.push(tmphis)
  }

  user.pwdHistory.forEach(function (pwd) {
    try {
      let oldSaltFinal = pwd.match(/\$.\$.+\$/g)[0].slice(0, -1)
      let hash = crypt(password, oldSaltFinal)
      if ('{CRYPT}' + hash === pwd.split('#')[3]) {
        passwordExistsInHistory = true
      }
    } catch (err) {
      return false
    }
  })
  return passwordExistsInHistory
}

function oldPassIsCorrect (user, oldPassword) {
  let oldPassVerifies = false
  try {
    let currentSalt = user.userPassword.match(/\$.\$.+\$/g)[0].slice(0, -1)
    let currentHash = crypt(oldPassword, currentSalt)
    if ('{CRYPT}' + currentHash === user.userPassword)
      oldPassVerifies = true
  }
  catch (err) {
    return false
  }
  return oldPassVerifies
}

function sendEmailToken (mailToken) {
  return new Promise(
    function (resolve, reject) {
      config.MAIL.sendMail(mailToken, (err, info) => {
        if (err) {
          reject(new ApplicationErrorClass(null, null, 57, err, 'Συνέβη κάποιο σφάλμα κατα την αποστολή email.', null, 500))
        } else {
          resolve()
        }
      })
    })
}

function buildEmailToken (user, token) {
  let bodyText = mailTexts.resetMailText['el'](token, user.uid, config.WEB_BASE_URL.url)
  let subject = mailTexts.resetMailSubject['el'].normalUser
  if (user.scope > 1) {
    subject = mailTexts.resetMailSubject['el'].privUser
  }
  return {
    from: mailTexts.resetMailFrom.el, // sender address
    to: user.mail, // list of receivers
    subject: subject, // Subject line
    html: bodyText // html body
  }
}

function validateIputForReset (user, resetMail) {
  return (user.dn && user.mail === resetMail)
}

function buildTokenAndMakeEntryForReset (user) {
  return new Promise(
    function (resolve, reject) {
      let token = crypto.randomBytes(45).toString('hex') //maybe make a func to build token
      let tmpResetRequest = new database.UserPassReset({
        uid: user.uid,
        dn: user.dn,
        mail: user.mail,
        token: token
      })
      tmpResetRequest.save(function (err, user) {
        if (err) {
          reject(new ApplicationErrorClass(null, null, 58, err, 'Συνέβη κάποιο σφάλμα κατα την δημιουργία token', null, 500))
        } else {
          resolve(token)
        }
      })
    })
}

function appendDatabaseInfo (users) {
  return new Promise(
    function (resolve, reject) {
      let calls = []
      users.forEach(function (user) {
        calls.push(function (callback) {
          database.Profile.findOne({ldapId: user.id}, 'profilePhoto socialMedia', function (err, profile) {
            if (err) {
              reject(err)
            } else {
              if (profile) {
                if (profile.profilePhoto && profile.profilePhoto.data) {
                  user['profilePhoto'] = 'data:' + profile.profilePhoto.contentType + ';base64,' + new Buffer(profile.profilePhoto.data, 'base64').toString('binary')
                } else {
                  user['profilePhoto'] = ''
                }
                user['socialMedia'] = profile.socialMedia
              }
              callback(null)
            }
          })
        })
      })

      async.parallel(calls, function (err) {
        if (err) {
          reject(err)
        } else {
          resolve(users)
        }
      })
    })
}

function searchUsersOnLDAP (ldapMain, opts) {
  return new Promise(
    function (resolve, reject) {
      ldapMain.search(config.LDAP[process.env.NODE_ENV].baseUserDN, opts, function (err, results) {
        if (err) {
          reject(err)
        } else {
          let usersArray = []
          let userCounter = 0
          results.on('searchEntry', function (user) {
            userCounter++
            addUserToArray(user, userCounter, usersArray)
          })
          results.on('error', function (err) {
            (err.code === 4) ? resolve(usersArray) : reject()
          })

          results.on('end', function (result) {
            resolve(usersArray)
          })
        }
      })
    })
}

function addUserToArray (user, userCounter, usersArray) {
  let tmp = user.object
  delete tmp.dn
  delete tmp.controls
  delete tmp.secondarymail
  tmp.serNumber = userCounter

  tmp.secondarymail = text2png(user.object.secondarymail, {
    font: '14px Futura',
    textColor: 'black',
    bgColor: 'white',
    lineSpacing: 1,
    padding: 1,
    output: 'dataURL'
  })

  usersArray.push(tmp)
}

function ldapSearchQueryFormat (query, id) {
  return new Promise(
    function (resolve, reject) {
      delete query._
      let output
      let attr = ['id', 'displayName', 'description', 'secondarymail', 'eduPersonAffiliation', 'title', 'telephoneNumber', 'labeledURI', 'eduPersonEntitlement']
      let searchAttr = [filter.attribute('eduPersonAffiliation').contains('staff')] //by default return only staff

      if (Object.prototype.hasOwnProperty.call(query, 'fields')) {
        delete query.fields
      }

      if (!(Object.keys(query).length === 0)) {
        searchAttr = []
        Object.keys(query).forEach(function (index) {
          if (attr.indexOf(index) > -1) {
            if (INTEGER_FIELDS.indexOf(index) > -1) {
              searchAttr.push(filter.attribute(index).equalTo(query[index]))
            } else if (index === 'labeledURI' || index === 'eduPersonEntitlement') {
              searchAttr.push(filter.attribute(index).equalTo(query[index]))
            }
            else {
              searchAttr.push(filter.attribute(index).contains(query[index]))
            }
          }
        })
      }

      if (id) {
        searchAttr.push(filter.attribute('id').equalTo(id))
        output = filter.AND(searchAttr)
      } else {
        output = filter.OR(searchAttr)
      }

      resolve({filter: output.toString(), scope: 'sub', paged: {pageSize: 250, pagePause: false}, attributes: attr})
    })
}

module.exports = {
  passwordsAreDifferent,
  oldPassIsCorrect,
  newPasswordExistsInHistory,
  sendEmailToken,
  buildEmailToken,
  validateIputForReset,
  buildTokenAndMakeEntryForReset,
  deleteResetToken,
  passwordsAreSame,
  ldapSearchQueryFormat,
  searchUsersOnLDAP,
  appendDatabaseInfo
}

