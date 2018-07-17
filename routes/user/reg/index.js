var express = require('express')
var router = express.Router()
const ldap = require('ldapjs')
var crypto = require('crypto')

const ApplicationErrorClass = require('./../../applicationErrorClass')
const apiFunctions = require('./../../apiFunctions')
const auth = require('../../../configs/auth')
const config = require('../../../configs/config')
const joi = require('./joi')
const functions = require('./functions')
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
  let password = req.body.password
  let user = {}
  let ldapBinded = null
  functions.checkIfTokenExistsAndRetrieveUser(req.params.token).then(userFromDatabase => {
    user = userFromDatabase
    return functions.checkPassword(owasp, password)
  }).then(() => {
    return functions.bindLdap(ldapMain)
  }).then(ldapMainBinded => {
    ldapBinded = ldapMainBinded
    return functions.changeScopeLdap(ldapBinded, user.dn)
  }).then(() => {
    return functions.changePasswordLdap(ldapBinded, user.dn, password)
  }).then(() => {
    res.json({chpw: true})
  }).catch(function (applicationError) {
    console.log(applicationError)
    applicationError.type = 'updatePassReg'
    applicationError.ip = apiFunctions.getClientIp(req)
    next(applicationError)
  })
}

function updateMailReg (req, res, next) {
  let newEmail = req.body.newMail
  functions.checkIfTokenExistsAndRetrieveUser.then(userFromDatabase => {
    let changeMailOpts = new ldap.Change({
      operation: 'replace',
      modification: {
        mail: newEmail
      }
    })

    functions.bindLdap(ldapMain).then(ldapMainBinded => {
      ldapMainBinded.modify(userFromDatabase.dn, changeMailOpts, function (err) {
        if (err) {
          console.log(err)
          next(new ApplicationErrorClass('updateMailReg', null, 39, err, 'Παρακαλώ δοκιμάστε αργότερα', apiFunctions.getClientIp(req), 500))
        } else {
          res.status(200)
        }
      })
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
  database.UserReg.findOne({token: req.params.token}).exec(function (err, userFromDatabase) {
    if (!err && userFromDatabase) {
      let opts = functions.buildOptions('(uid=' + userFromDatabase.uid + ')', 'sub', ['uid', 'cn', 'regyear', 'fathersname', 'eduPersonScopedAffiliation'])

      ldapMain.search(config.LDAP[process.env.NODE_ENV].baseUserDN, opts, function (err, results) {
        if (err) {
          next(new ApplicationErrorClass('getInfo', null, 36, err, 'Παρακαλώ δοκιμάστε αργότερα', apiFunctions.getClientIp(req), 500))
        }
        let userFromLdap = {}
        results.on('searchEntry', function (entry) {
          userFromLdap = entry.object
        })
        results.on('error', function (err) {
          next(new ApplicationErrorClass('getInfo', null, 37, err, 'Παρακαλώ δοκιμάστε αργότερα', apiFunctions.getClientIp(req), 500))
        })
        results.on('end', function () {
          userFromDatabase.dn = userFromLdap.dn
          userFromDatabase.save(function (err) {
            res.status(200).send(userFromLdap)
          })
        })
      })
    } else {
      next(new ApplicationErrorClass('getInfo', null, 35, null, 'Παρακαλώ δοκιμάστε ξανά από το βήμα 1', apiFunctions.getClientIp(req), 500))
    }
  })
}

function checkPithiaUserAndCreateEntryDB (req, res, next) {
  let ldapTei = ldap.createClient({
    url: config.LDAP_TEI.host
  })

  let username = req.body.usernamePithia
  let password = req.body.passwordPithia
  let opts = functions.buildOptions('(uid=' + username + ')', 'sub', 'uid')

  ldapTei.search(config.LDAP_TEI.baseUserDN, opts, function (err, results) {
    if (err) {
      next(new ApplicationErrorClass('pauth', null, 31, err, 'Παρακαλώ δοκιμάστε αργότερα', apiFunctions.getClientIp(req), 500))
    }
    let user = {}
    results.on('searchEntry', function (entry) {
      user = entry.object
    })
    results.on('error', function (err) {
      next(new ApplicationErrorClass(null, null, 32, null, 'Παρακαλώ δοκιμάστε αργότερα', null, 500))
    })
    results.on('end', function () {
      functions.validateUserAndPassOnPithia(ldapTei, user, password).then(() => {
        let hash = crypto.createHash('sha1').update(Math.random().toString()).digest('hex')
        let newUser = new database.UserReg({uid: user.uid, dn: user.dn, token: hash})
        newUser.save(function () {
          res.status(200).send({uid: user.uid, auth: true})
        })
      }).catch(function (err) {
        next(err)
      })
    })
  })

  ldapTei.unbind(function (err) {
  })
}

//TODO WHERE DO WE SAVE OUR DATA? BEFORE IT WAS RES.SESSION
function checkTokenUser (req, res, next) {
  let mail = req.body.mail
  let token = req.body.token
  database.UserReg.findOne({token: token, mail: mail}).exec(function (err, user) {
    if (err || !user) {
      next(new ApplicationErrorClass('checkTokenUser', null, 34, err, 'Λάθος Mail ή Token.', apiFunctions.getClientIp(req), 500))
    } else {
      res.status(200).json({auth: true, uid: user.uid})
    }
  })
}

module.exports = {
  router: router
}
