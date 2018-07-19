var express = require('express')
var router = express.Router()
const ldap = require('ldapjs')
var crypto = require('crypto')

const ApplicationErrorClass = require('./../../applicationErrorClass')
const apiFunctions = require('./../../apiFunctions')
const config = require('../../../configs/config')
const joi = require('./joi')
const functions = require('./functions')
const functionsUser = require('./../function')
const database = require('../../../configs/database')
const owasp = require('owasp-password-strength-test')

let ldapMain = config.LDAP_CLIENT
owasp.config(config.OWASP_CONFIG)

router.get('/info/:token', getInfoFromLdap)
router.post('/pauth', apiFunctions.validateInput('body', joi.pithiaUser), checkPithiaUserAndCreateEntryDB)
router.post('/mtoken', apiFunctions.validateInput('body', joi.tokenUser), checkTokenUser)
router.post('/updatemail/:token', apiFunctions.validateInput('body', joi.updateMailReg), updateMailReg)
router.post('/updatepass/:token', apiFunctions.validateInput('body', joi.updatePassReg), updatePassReg)

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
    res.json({chpw: true})
  }).catch(function (applicationError) {
    applicationError.type = 'updatePassReg'
    applicationError.ip = apiFunctions.getClientIp(req)
    next(applicationError)
  })
}

//IN ORDER TO WORK YOU NEED TO HIT /info FIRST
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
  let userFromDatabase = {}

  functionsUser.checkIfTokenExistsAndRetrieveUser(token, database.UserReg).then(userFromDatabase => {
    let opts = functionsUser.buildOptions('(uid=' + userFromDatabase.uid + ')', 'sub', ['uid', 'cn', 'regyear', 'fathersname', 'eduPersonScopedAffiliation'])
    return functionsUser.searchUserOnLDAP(ldapMain, opts)
  }).then(userFromLdap => {
    userFromDatabase.dn = userFromLdap.dn
    userFromDatabase.scope = userFromLdap.eduPersonScopedAffiliation
    userFromDatabase.save(function (err) {
      res.status(200).send(userFromLdap)
    })
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
          let hash = crypto.randomBytes(45).toString('hex')
          let newUser = new database.UserReg({uid: user.uid, dn: user.dn, token: hash})
          newUser.save(function () {
            res.status(200).send({uid: user.uid, token: hash})
          })
        }).catch(function (applicationError) {
          next(applicationError)
        })
      })
    }
  })

  //TODO CHECK FOR UNBINDES
  ldapTei.unbind(function (err) {
  })
}

//TODO THIS IS ABOUT MAIL TOKEN AUTH.IT NEEDS TO BE DISCUSSED
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
