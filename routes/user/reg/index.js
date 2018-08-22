const express = require('express')
const router = express.Router()
const ldap = require('ldapjs')
const crypto = require('crypto')

const ApplicationError = require('./../../applicationErrorClass')
const Log = require('./../../logClass')
const apiFunctions = require('./../../apiFunctions')
const getClientIp = require('./../../apiFunctions').getClientIp
const config = require('../../../configs/config')
const validSchemas = require('./joi')
const functions = require('./functions')
const functionsUser = require('../functionsUser')
const database = require('../../../configs/database')
const owasp = require('owasp-password-strength-test')
const ldapFunctions = require('../../ldapFunctions')

let ldapMain = config.LDAP_CLIENT
owasp.config(config.OWASP_CONFIG)

router.get('/info/:token', getInfoFromLdap)
router.post('/pauth', apiFunctions.validateInput('body', validSchemas.pithiaUser), checkPithiaUserAndCreateEntryDB)
router.post('/mtoken', apiFunctions.validateInput('body', validSchemas.tokenUser), checkTokenUser)
router.post('/updatemail/:token', apiFunctions.validateInput('body', validSchemas.updateMailReg), updateMailReg)
router.post('/updatepass/:token', apiFunctions.validateInput('body', validSchemas.updatePassReg), updatePassReg)

function updatePassReg (req, res, next) {
  let token = req.params.token
  let password = req.body.password
  let user = {}
  let ldapBinded = null
  functionsUser.checkIfTokenExistsAndRetrieveUser(token, database.UserReg).then(userFromDatabase => {
    user = userFromDatabase
    return functionsUser.checkPassword(owasp, password)
  }).then(() => {
    return ldapFunctions.bindLdap(ldapMain)
  }).then(ldapMainBinded => {
    ldapBinded = ldapMainBinded
    return functions.changeScopeLdap(ldapBinded, user.dn, user.scope)
  }).then(() => {
    return functionsUser.changePasswordLdap(ldapBinded, user.dn, password)
  }).then(() => {
    return functions.deleteRegToken(token)
  }).then(() => {
    let log = new Log('updatePassReg', null, 'O κωδικκός ενημερώθηκε επιτυχώς', getClientIp(req), 200)
    log.logAction('user')
    res.sendStatus(200)
  }).catch(function (promiseErr) {
    let applicationError = new ApplicationError('updatePassReg', null, promiseErr.code,
      promiseErr.error, 'Σφάλμα κατα την ενημέρωση κωδικού.', getClientIp(req), promiseErr.httpCode)
    next(applicationError)
  })
}

function updateMailReg (req, res, next) {
  let newEmail = req.body.newMail
  functionsUser.checkIfTokenExistsAndRetrieveUser(req.params.token, database.UserReg).then(userFromDatabase => {
    ldapFunctions.bindLdap(ldapMain).then(ldapMainBinded => {
      return functionsUser.changeMailLdap(ldapMainBinded, userFromDatabase.dn, newEmail)
    }).then(() => {
      let log = new Log('updateMailReg', null, 'Το mail ενημερώθηκε επιτυχώς', getClientIp(req), 200)
      log.logAction('user')
      res.sendStatus(200)
    }).catch(function (promiseErr) {
      let applicationError = new ApplicationError('updatePassReg', null, promiseErr.code,
        promiseErr.error, 'Σφάλμα κατα την ενημέρωση email.', getClientIp(req), promiseErr.httpCode)
      next(applicationError)
    })
  }).catch(function (promiseErr) {
    let applicationError = new ApplicationError('updatePassReg', null, promiseErr.code,
      promiseErr.error, 'Σφάλμα κατα την ενημέρωση email.', getClientIp(req), promiseErr.httpCode)
    next(applicationError)
  })
}

function getInfoFromLdap (req, res, next) {
  let token = req.params.token

  functionsUser.checkIfTokenExistsAndRetrieveUser(token, database.UserReg).then(userFromDatabase => {
    let opts = ldapFunctions.buildOptions('(uid=' + userFromDatabase.uid + ')', 'sub', ['uid', 'cn', 'regyear', 'fathersname', 'eduPersonScopedAffiliation'])
    return ldapFunctions.searchUserOnLDAP(ldapMain, opts)
  }).then(userFromLdap => {
    res.status(200).send(userFromLdap)
  }).catch(function (promiseErr) {
    let applicationError = new ApplicationError('getInfoFromLdap', null, promiseErr.code,
      promiseErr.error, 'Σφάλμα κατα την λήψη στοιχείων.', getClientIp(req), promiseErr.httpCode)
    next(applicationError)
  })
}

function checkPithiaUserAndCreateEntryDB (req, res, next) {
  let ldapTei = ldap.createClient({
    url: config.LDAP_TEI.host
  })

  let username = req.body.usernamePithia
  let password = req.body.passwordPithia
  let opts = ldapFunctions.buildOptions('(uid=' + username + ')', 'sub', 'uid')

  ldapTei.search(config.LDAP_TEI.baseUserDN, opts, function (err, results) {
    if (err) {
      next(new ApplicationError('pauth', null, 2111, err, 'Παρακαλώ δοκιμάστε αργότερα', getClientIp(req), 500, false))
    } else {
      let user = {}
      results.on('searchEntry', function (entry) {
        user = entry.object
      })
      results.on('error', function (err) {
        next(new ApplicationError('pauth', null, 2112, err, 'Παρακαλώ δοκιμάστε αργότερα', getClientIp(req), 500, false))
      })
      results.on('end', function () {
        functions.validateUserAndPassOnPithia(ldapTei, user, password).then(() => {
          let opts = ldapFunctions.buildOptions('(uid=' + user.uid + ')', 'sub', ['uid', 'cn', 'regyear', 'fathersname', 'eduPersonScopedAffiliation'])
          return ldapFunctions.searchUserOnLDAP(ldapMain, opts)
        }).then(userFromLdap => {
          let hash = crypto.randomBytes(45).toString('hex')
          let newUser = new database.UserReg({
            uid: userFromLdap.uid,
            dn: userFromLdap.dn,
            token: hash,
            scope: userFromLdap.eduPersonScopedAffiliation
          })
          newUser.save(function () {
            let log = new Log('checkPithiaUserAndCreateEntryDB', null, 'Τα στοιχεία ηταν επιτυχή.', getClientIp(req), 200)
            log.logAction('user')
            res.status(200).send({token: hash})
          })
        }).catch(function (promiseErr) {
          let applicationError = new ApplicationError('checkPithiaUserAndCreateEntryDB', null, promiseErr.code,
            promiseErr.error, 'Σφάλμα κατα την λήψη δεδομένων.', getClientIp(req), promiseErr.httpCode)
          next(applicationError)
        })
      })
    }
  })

  ldapTei.unbind(function () {
  })
}

// TODO CHECK WHEN LDAP CREATES TOKEN FOR ACTIVATING
function checkTokenUser (req, res, next) {
  let mail = req.body.mail
  let token = req.body.token
  database.UserRegMailToken.findOne({token: token, mail: mail}).exec(function (err, user) {
    if (err || !user) {
      next(new ApplicationError('checkTokenUser', null, 2121, err, 'Λάθος Mail ή Token.', getClientIp(req), 500, false))
    } else {
      let hash = crypto.createHash('sha1').update(Math.random().toString()).digest('hex')
      let newUser = new database.UserReg({uid: user.uid, dn: user.dn, token: hash})
      newUser.save(function () {
        let log = new Log('checkTokenUser', null, 'Το token είναι σωστό.', getClientIp(req), 200)
        log.logAction('user')
        res.status(200).json({auth: true, uid: user.uid})
      })
    }
  })
}

module.exports = {
  router: router
}
