var express = require('express')
var router = express.Router()
const ldap = require('ldapjs')
var crypto = require('crypto')

const ApplicationErrorClass = require('./../../applicationErrorClass')
const apiFunctions = require('./../../apiFunctions')
const config = require('../../../configs/config')
const validSchemas = require('./joi')
const functions = require('./functions')
const functionsUser = require('../functionsUser')
const database = require('../../../configs/database')
const owasp = require('owasp-password-strength-test')

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
    return functionsUser.bindLdap(ldapMain)
  }).then(ldapMainBinded => {
    ldapBinded = ldapMainBinded
    return functions.changeScopeLdap(ldapBinded, user.dn, user.scope)
  }).then(() => {
    return functionsUser.changePasswordLdap(ldapBinded, user.dn, password)
  }).then(() => {
    return functions.deleteRegToken(token)
  }).then(() => {
    res.sendStatus(200)
  }).catch(function (applicationError) {
    applicationError.type = 'updatePassReg'
    applicationError.ip = apiFunctions.getClientIp(req)
    next(applicationError)
  })
}

function updateMailReg (req, res, next) {
  let newEmail = req.body.newMail
  functionsUser.checkIfTokenExistsAndRetrieveUser(req.params.token, database.UserReg).then(userFromDatabase => {
    functionsUser.bindLdap(ldapMain).then(ldapMainBinded => {
      return functionsUser.changeMailLdap(ldapMainBinded, userFromDatabase.dn, newEmail)
    }).then(() => {
      res.status(200)
    }).catch(function (err) {
      next(new ApplicationErrorClass('updateMailReg', null, 40, err, 'Παρακαλώ δοκιμάστε αργότερα', apiFunctions.getClientIp(req), 500))
    })
  }).catch(function (applicationError) {
    applicationError.type = 'updateMailReg'
    applicationError.ip = apiFunctions.getClientIp(req)
    next(applicationError)
  })
}

function getInfoFromLdap (req, res, next) {
  let token = req.params.token

  functionsUser.checkIfTokenExistsAndRetrieveUser(token, database.UserReg).then(userFromDatabase => {
    let opts = functionsUser.buildOptions('(uid=' + userFromDatabase.uid + ')', 'sub', ['uid', 'cn', 'regyear', 'fathersname', 'eduPersonScopedAffiliation'])
    return functionsUser.searchUserOnLDAP(ldapMain, opts)
  }).then(userFromLdap => {
    res.status(200).send(userFromLdap)
  }).catch(function (applicationError) {
    next(applicationError)
  })
}

function checkPithiaUserAndCreateEntryDB (req, res, next) {
  let ldapTei = ldap.createClient({
    url: config.LDAP_TEI.host
  })

  let username = req.body.usernamePithia
  let password = req.body.passwordPithia
  let opts = functionsUser.buildOptions('(uid=' + username + ')', 'sub', 'uid')

  ldapTei.search(config.LDAP_TEI.baseUserDN, opts, function (err, results) {
    if (err) {
      next(new ApplicationErrorClass('pauth', null, 31, err, 'Παρακαλώ δοκιμάστε αργότερα', apiFunctions.getClientIp(req), 500))
    } else {
      let user = {}
      results.on('searchEntry', function (entry) {
        user = entry.object
      })
      results.on('error', function (err) {
        next(new ApplicationErrorClass(null, null, 32, err, 'Παρακαλώ δοκιμάστε αργότερα', null, 500))
      })
      results.on('end', function () {
        functions.validateUserAndPassOnPithia(ldapTei, user, password).then(() => {
          let opts = functionsUser.buildOptions('(uid=' + user.uid + ')', 'sub', ['uid', 'cn', 'regyear', 'fathersname', 'eduPersonScopedAffiliation'])
          return functionsUser.searchUserOnLDAP(ldapMain, opts)
        }).then(userFromLdap => {
          let hash = crypto.randomBytes(45).toString('hex')
          let newUser = new database.UserReg({
            uid: userFromLdap.uid,
            dn: userFromLdap.dn,
            token: hash,
            scope: userFromLdap.eduPersonScopedAffiliation
          })
          newUser.save(function () {
            res.status(200).send({token: hash})
          })
        }).catch(function (applicationError) {
          next(applicationError)
        })
      })
    }
  })

  ldapTei.unbind(function (err) {
  })
}

//TODO CHECK WHEN LDAP CREATES TOKEN FOR ACTIVATING
function checkTokenUser (req, res, next) {
  let mail = req.body.mail
  let token = req.body.token
  database.UserRegMailToken.findOne({token: token, mail: mail}).exec(function (err, user) {
    if (err || !user) {
      next(new ApplicationErrorClass('checkTokenUser', null, 34, err, 'Λάθος Mail ή Token.', apiFunctions.getClientIp(req), 500))
    } else {
      let hash = crypto.createHash('sha1').update(Math.random().toString()).digest('hex')
      let newUser = new database.UserReg({uid: user.uid, dn: user.dn, token: hash})
      newUser.save(function () {
        res.status(200).json({auth: true, uid: user.uid})
      })
    }
  })
}

module.exports = {
  router: router
}
