const express = require('express')
const router = express.Router()
const owasp = require('owasp-password-strength-test')


const ApplicationErrorClass = require('./../../applicationErrorClass')
const apiFunctions = require('./../../apiFunctions')
const auth = require('../../../configs/auth')
const config = require('../../../configs/config')
const joi = require('./joi')
const functions = require('./function')
const functionsUser = require('./../function')
const database = require('../../../configs/database')

let ldapMain = config.LDAP_CLIENT
owasp.config(config.OWASP_CONFIG)

router.post('/chpw', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.validateInput('body', joi.chpw), updatePassword)
router.post('/chmail', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.validateInput('body', joi.updateMail), updateMail)
router.post('/reset', apiFunctions.validateInput('body', joi.resetPassword), resetPassword)
router.post('/reset/token', apiFunctions.validateInput('body', joi.resetPasswordToken), resetPasswordToken)

router.get('/all/:id?', getUsers)

function getUsers (req, res, next) {
  let userId = req.params.id
  functions.ldapSearchQueryFormat(req.query, userId)
    .then(function (options) {
      return functions.searchUsersOnLDAP(ldapMain, options)
    }).then(users => {
    return functions.appendDatabaseInfo(users)
  }).then(users => {
    res.json(users)
  }).catch(function (applicationError) {
    next(applicationError)
  })
}

function resetPasswordToken (req, res, next) {
  let token = req.body.token
  let newPassword = req.body.newPassword
  let newPasswordVerify = req.body.newPasswordVerify
  let ldapBinded = null
  let user

  if (functions.passwordsAreSame(newPassword, newPasswordVerify)) {
    functionsUser.checkIfTokenExistsAndRetrieveUser(token, database.UserPassReset).then(userFromDatabase => {
      user = userFromDatabase
      return functionsUser.checkPassword(owasp, newPassword)
    }).then(() => {
      return functionsUser.bindLdap(ldapMain)
    }).then(ldapMainBinded => {
      ldapBinded = ldapMainBinded
      let opts = functionsUser.buildOptions('(uid=' + user.uid + ')', 'sub', ['pwdHistory', 'userPassword']) //check if this is the correct id
      return functionsUser.searchUserOnLDAP(ldapMainBinded, opts)
    }).then(user => {
      if (!functions.newPasswordExistsInHistory(user, newPassword, next)) {
        return functionsUser.changePasswordLdap(ldapBinded, user.dn, newPassword)
      } else {
        throw new ApplicationErrorClass('resetPasswordToken', null, 50, null, 'Ο νέος κωδικός δεν μπορεί να είναι ίδιος με κάποιον που είχατε στο παρελθόν', apiFunctions.getClientIp(req), 500)
      }
    }).then(() => {
      return functions.deleteResetToken(token)
    }).then(() => {
      res.sendStatus(200)
    }).catch(function (applicationError) {
      next(applicationError)
    })
  } else {
    next(new ApplicationErrorClass('resetPasswordToken', null, 50, null, 'Οι κωδικοί δεν ταυτίζοντε.', apiFunctions.getClientIp(req), 500))
  }
}

function resetPassword (req, res, next) {
  let resetMail = req.body.mail
  let resetUsername = req.body.username
  let user = {}
  //TODO REQUEST GOOGLE REPATCHA
  let opts = functionsUser.buildOptions('(uid=' + resetUsername + ')', 'sub', ['uid', 'mail']) //check if this is the correct id
  functionsUser.searchUserOnLDAP(ldapMain, opts).then(userFromLdap => {
    user = userFromLdap
    if (functions.validateIputForReset(user, resetMail)) {
      return functions.buildTokenAndMakeEntryForReset(user)
    } else {
      throw new ApplicationErrorClass('resetPassword', null, 53, null, 'Τα στοιχεία σας δεν είναι σωστά.', apiFunctions.getClientIp(req), 500)
    }
  }).then(token => {
    let mailToken = functions.buildEmailToken(user, token)
    return functions.sendEmailToken(mailToken)
  }).then(() => {
    res.status(200).json({
      message: 'Το αίτημα στάλθηκε επιτυχώς.',
      message2: 'Αν η διευθυνση που εισάγατε και το όνομα χρήστη αντιστοιχεί σε κάποιο λογαριασμό, τότε θα λάβετε ένα mail με την διαδικασία επαναφοράς του κωδικού.'
    })
  }).catch(function (applicationError) {
    applicationError.type = 'updatePassword'
    applicationError.user = req.user
    applicationError.ip = apiFunctions.getClientIp(req)
    next(applicationError)
  })
}

function updatePassword (req, res, next) {
  let oldPassword = req.body.oldPassword
  let newPassword = req.body.newPassword
  let ldapBinded = null

  if (functions.passwordsAreDifferent(oldPassword, newPassword)) {
    functionsUser.checkPassword(owasp, newPassword).then(() => {
      return functionsUser.bindLdap(ldapMain)
    }).then(ldapMainBinded => {
      ldapBinded = ldapMainBinded
      let opts = functionsUser.buildOptions('(uid=' + req.user.uid + ')', 'sub', ['pwdHistory', 'userPassword']) //check if this is the correct id
      return functionsUser.searchUserOnLDAP(ldapMainBinded, opts)
    }).then(user => {
      if (functions.oldPassIsCorrect(user, oldPassword)) {
        if (!functions.newPasswordExistsInHistory(user, newPassword)) {
          return functionsUser.changePasswordLdap(ldapBinded, user.dn, newPassword)
        } else {
          throw new ApplicationErrorClass('updatePassword', req.user.id, 50, null, 'Ο νέος κωδικός δεν μπορεί να είναι ίδιος με κάποιον που είχατε στο παρελθόν', apiFunctions.getClientIp(req), 500)
        }
      } else {
        throw new ApplicationErrorClass('updatePassword', req.user.id, 51, null, 'Ο Τρέχον Κωδικός Πρόσβασης είναι λάθος.', apiFunctions.getClientIp(req), 500)
      }
    }).then(() => {
      res.sendStatus(200)
    }).catch(function (applicationError) {
      applicationError.type = 'updatePassword'
      applicationError.user = req.user.id
      applicationError.ip = apiFunctions.getClientIp(req)
      next(applicationError)
    })
  } else {
    next(new ApplicationErrorClass('updatePassword', req.user, 52, null, 'Ο νέος κωδικός δεν μπορεί να είναι ίδιος με τον τρέχον.', apiFunctions.getClientIp(req), 500))
  }
}

function updateMail (req, res, next) {
  let newEmail = req.body.newMail
  let ldapBinded = null
  let opts = functionsUser.buildOptions('(uid=' + req.user.uid + ')', 'sub', 'uid') //check if this is the correct id
  functionsUser.bindLdap(ldapMain).then(ldapMainBinded => {
    ldapBinded = ldapMainBinded
    return functionsUser.searchUserOnLDAP(ldapBinded, opts)
  }).then(user => {
    return functionsUser.changeMailLdap(ldapBinded, user.dn, newEmail)
  }).then(() => {
    res.sendStatus(200)
  }).catch(function (applicationError) {
    applicationError.type = 'updatePassword'
    applicationError.user = req.user
    applicationError.ip = apiFunctions.getClientIp(req)
    next(applicationError)
  })
}

module.exports = {
  router: router
}