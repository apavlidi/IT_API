const crypt = require('crypt3/sync')
const crypto = require('crypto')

const mailTexts = require('./../../../configs/mailText')
const config = require('../../../configs/config')
const database = require('../../../configs/database')
const ApplicationErrorClass = require('../../applicationErrorClass')

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

module.exports = {
  passwordsAreDifferent,
  oldPassIsCorrect,
  newPasswordExistsInHistory,
  sendEmailToken,
  buildEmailToken,
  validateIputForReset,
  buildTokenAndMakeEntryForReset,
  deleteResetToken,
  passwordsAreSame
}
