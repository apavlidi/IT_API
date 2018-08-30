const express = require('express')
const router = express.Router()
const owasp = require('owasp-password-strength-test')

const ApplicationError = require('./../../applicationErrorClass')
const Log = require('./../../logClass')
const apiFunctions = require('./../../apiFunctions')
const getClientIp = require('./../../apiFunctions').getClientIp
const auth = require('../../../configs/auth')
const config = require('../../../configs/config')
const validSchemas = require('./joi')
const functions = require('./function')
const functionsUser = require('../functionsUser')
const database = require('../../../configs/database')
const vCardT = require('vcards-js')
const ldapFunctions = require('../../ldapFunctions')

let ldapMain = config.LDAP_CLIENT
owasp.config(config.OWASP_CONFIG)

router.post('/chpw', auth.checkAuth(['edit_password'], config.PERMISSIONS.student), apiFunctions.validateInput('body', validSchemas.chpw), updatePassword)
router.post('/chmail', auth.checkAuth(['edit_mail'], config.PERMISSIONS.student), apiFunctions.validateInput('body', validSchemas.updateMail), updateMail)
router.post('/reset', apiFunctions.validateInput('body', validSchemas.resetPassword), resetPassword)
router.post('/reset/token', apiFunctions.validateInput('body', validSchemas.resetPasswordToken), resetPasswordToken)

router.get('/vcard/:uid', getUserVCard)
router.get('/', getUsers)

function getUserVCard (req, res, next) {
  let userUid = req.params.uid
  let options = ldapFunctions.buildOptions('(uid=' + userUid + ')', 'sub', ['id', 'displayName', 'description', 'secondarymail', 'eduPersonAffiliation', 'title', 'telephoneNumber', 'labeledURI']) // check if this is the correct id
  ldapFunctions.searchUserOnLDAP(ldapMain, options).then(user => {
    if (user) {
      if (Object.keys(user).length !== 0) {
        delete user.controls
        delete user.dn
        let vCard = vCardT()
        vCard.firstName = user['displayName;lang-el']
        vCard.organization = 'Τμήμα Πληροφορικής ΑΤΕΙΘ'
        vCard.workPhone = user['telephoneNumber']
        vCard.title = user['title;lang-el']
        vCard.workUrl = user['labeledURI']
        vCard.note = user['description;lang-el']
        vCard.email = user['secondarymail']
        res.set('Content-Type', 'text/vcard; name="user.vcf"')
        res.set('Content-Disposition', 'inline; filename="user.vcf"')
        res.send(vCard.getFormattedString())
      }
    } else {
      next(new ApplicationError('getUserVCard', null, 2241, null, 'Κάτι πήγε στραβά.', getClientIp(req), 500, false))
    }
  }).catch(function (promiseErr) {
    let applicationError = new ApplicationError('getUserVCard', null, promiseErr.code,
      promiseErr.error, 'Σφάλμα κατα την λήψη vCard.', getClientIp(req), promiseErr.httpCode, false)
    next(applicationError)
  })
}

// TODO CHECK FOR PAGING IF POSSIBLE
function getUsers (req, res, next) {
  functions.ldapSearchQueryFormat(req.query, true)
    .then(function (options) {
      return ldapFunctions.searchUsersOnLDAP(ldapMain, options)
    }).then(users => {
      return functionsUser.appendDatabaseInfo(users, req.query)
    }).then(users => {
      let usersSorted = functions.checkForSorting(users, req.query)
      res.status(200).json(usersSorted)
    }).catch(function (promiseErr) {
      let applicationError = new ApplicationError('getUsers', null, promiseErr.code,
        promiseErr.error, 'Σφάλμα κατα την λήψη χρηστών.', getClientIp(req), promiseErr.httpCode, false)
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
      return ldapFunctions.bindLdap(ldapMain)
    }).then(ldapMainBinded => {
      ldapBinded = ldapMainBinded
      let opts = ldapFunctions.buildOptions('(uid=' + user.uid + ')', 'sub', ['pwdHistory', 'userPassword']) // check if this is the correct id
      return ldapFunctions.searchUserOnLDAP(ldapMainBinded, opts)
    }).then(user => {
      if (!functions.newPasswordExistsInHistory(user, newPassword, next)) {
        return functionsUser.changePasswordLdap(ldapBinded, user.dn, newPassword)
      } else {
        throw new ApplicationError('resetPasswordToken', null, 2231, null, 'Ο νέος κωδικός δεν μπορεί να είναι ίδιος με κάποιον που είχατε στο παρελθόν', getClientIp(req), 500)
      }
    }).then(() => {
      return functions.deleteResetToken(token)
    }).then(() => {
      let log = new Log('resetPasswordToken', null, 'Ο κωδικός άλλαξε επιτυχώς.', getClientIp(req), 200)
      log.logAction('user')
      res.sendStatus(200)
    }).catch(function (promiseErr) {
      let applicationError = new ApplicationError('resetPasswordToken', null, promiseErr.code,
        promiseErr.error, 'Σφάλμα κατα την ενημέρωση κωδικού.', getClientIp(req), promiseErr.httpCode)
      next(applicationError)
    })
  } else {
    next(new ApplicationError('resetPasswordToken', null, 2233, null, 'Οι κωδικοί δεν ταυτίζοντε.', getClientIp(req), 500))
  }
}

function resetPassword (req, res, next) {
  let resetMail = req.body.mail
  let resetUsername = req.body.username
  let user = {}
  // TODO REQUEST GOOGLE REPATCHA
  let opts = ldapFunctions.buildOptions('(uid=' + resetUsername + ')', 'sub', ['uid', 'mail']) // check if this is the correct id
  ldapFunctions.searchUserOnLDAP(ldapMain, opts).then(userFromLdap => {
    user = userFromLdap
    if (functions.validateIputForReset(user, resetMail)) {
      return functions.buildTokenAndMakeEntryForReset(user)
    } else {
      throw new ApplicationError('resetPassword', null, 2222, null, 'Τα στοιχεία σας δεν είναι σωστά.', getClientIp(req), 500)
    }
  }).then(token => {
    let mailToken = functions.buildEmailToken(user, token, 'Reset Mail')
    return functions.sendEmailToken(mailToken)
  }).then(() => {
    let log = new Log('resetPassword', null, 'Το αίτημα στάλθηκε επιτυχώς.', getClientIp(req), 200)
    log.logAction('user')
    res.status(200).json({
      message: 'Το αίτημα στάλθηκε επιτυχώς.',
      message2: 'Αν η διευθυνση που εισάγατε και το όνομα χρήστη αντιστοιχεί σε κάποιο λογαριασμό, τότε θα λάβετε ένα mail με την διαδικασία επαναφοράς του κωδικού.'
    })
  }).catch(function (promiseErr) {
    let applicationError = new ApplicationError('resetPassword', null, promiseErr.code,
      promiseErr.error, 'Σφάλμα κατα την ενημέρωση κωδικού.', getClientIp(req), promiseErr.httpCode)
    next(applicationError)
  })
}

function updatePassword (req, res, next) {
  let oldPassword = req.body.oldPassword
  let newPassword = req.body.newPassword
  let ldapBinded = null

  if (functions.passwordsAreDifferent(oldPassword, newPassword)) {
    functionsUser.checkPassword(owasp, newPassword).then(() => {
      return ldapFunctions.bindLdap(ldapMain)
    }).then(ldapMainBinded => {
      ldapBinded = ldapMainBinded
      let opts = ldapFunctions.buildOptions('(uid=' + req.user.uid + ')', 'sub', ['pwdHistory', 'userPassword']) // check if this is the correct id
      return ldapFunctions.searchUserOnLDAP(ldapMainBinded, opts)
    }).then(user => {
      if (functions.oldPassIsCorrect(user, oldPassword)) {
        if (!functions.newPasswordExistsInHistory(user, newPassword)) {
          return functionsUser.changePasswordLdap(ldapBinded, user.dn, newPassword)
        } else {
          throw new ApplicationError('updatePassword', req.user.id, 2200, null, 'Ο νέος κωδικός δεν μπορεί να είναι ίδιος με κάποιον που είχατε στο παρελθόν', getClientIp(req), 500)
        }
      } else {
        throw new ApplicationError('updatePassword', req.user.id, 2201, null, 'Ο Τρέχον Κωδικός Πρόσβασης είναι λάθος.', getClientIp(req), 500)
      }
    }).then(() => {
      let log = new Log('updatePassword', req.user.id, 'O κωδικός ενημερώθηκε επιτυχώς', getClientIp(req), 200)
      log.logAction('user')
      res.sendStatus(200)
    }).catch(function (promiseErr) {
      let applicationError = new ApplicationError('updatePassword', req.user.id, promiseErr.code,
        promiseErr.error, 'Σφάλμα κατα την ενημέρωση κωδικού.', getClientIp(req), promiseErr.httpCode)
      next(applicationError)
    })
  } else {
    next(new ApplicationError('updatePassword', req.user.id, 2202, null, 'Ο νέος κωδικός δεν μπορεί να είναι ίδιος με τον τρέχον.', getClientIp(req), 500))
  }
}

function updateMail (req, res, next) {
  let newEmail = req.body.newMail
  let ldapBinded = null
  let opts = ldapFunctions.buildOptions('(uid=' + req.user.uid + ')', 'sub', 'uid') // check if this is the correct id
  ldapFunctions.bindLdap(ldapMain).then(ldapMainBinded => {
    ldapBinded = ldapMainBinded
    return ldapFunctions.searchUserOnLDAP(ldapBinded, opts)
  }).then(user => {
    return functionsUser.changeMailLdap(ldapBinded, user.dn, newEmail)
  }).then(() => {
    let log = new Log('updateMail', req.user.id, 'Το mail ενημερώθηκε επιτυχώς', getClientIp(req), 200)
    log.logAction('user')
    res.sendStatus(200)
  }).catch(function (promiseErr) {
    let applicationError = new ApplicationError('updateMail', req.user.id, promiseErr.code,
      promiseErr.error, 'Σφάλμα κατα την ενημέρωση email.', getClientIp(req), promiseErr.httpCode)
    next(applicationError)
  })
}

module.exports = {
  router
}
