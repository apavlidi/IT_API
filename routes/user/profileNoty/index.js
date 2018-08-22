const express = require('express')
const router = express.Router()

const database = require('../../../configs/database')
const functions = require('./function')
const apiFunctions = require('./../../apiFunctions')
const getClientIp = require('./../../apiFunctions').getClientIp
const auth = require('../../../configs/auth')
const config = require('../../../configs/config')
const ApplicationError = require('./../../applicationErrorClass')
const Log = require('./../../logClass')
const validSchemas = require('./joi')

router.get('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), getNotySub)
router.patch('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.validateInput('body', validSchemas.enableNotySub), enableNotySub)
router.delete('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.validateInput('body', validSchemas.disableNotySub), disableNotySub)

// TODO REFACTOR
function disableNotySub (req, res, next) {
  database.Profile.findOne({ldapId: req.user.id}).exec(function (err, profile) {
    if (!err && profile) {
      if (req.body.all && req.body.all === 'true') {
        functions.disableAllNotiesSub(profile).then(() => {
          let log = new Log('disableNotySub', req.user.id, 'Η εγγραφή ενημερώθηκε επιτυχώς', getClientIp(req), 200)
          log.logAction('user')
          res.sendStatus(200)
        }).catch(function (promiseErr) {
          let applicationError = new ApplicationError('disableNotySub', req.user.id, promiseErr.code,
            promiseErr.error, 'Σφάλμα κατα την ενημέρωση εγγραφής.', getClientIp(req), promiseErr.httpCode)
          next(applicationError)
        })
      } else {
        functions.checkIfSubscribedAlready(req.user.id, req.body.browserFp).then(result => {
          return functions.modifyNotySub(result.profile, req.body, false)
        }).then(() => {
          let log = new Log('disableNotySub', req.user.id, 'Η εγγραφή ενημερώθηκε επιτυχώς', getClientIp(req), 200)
          log.logAction('user')
          res.sendStatus(200)
        }).catch(function (promiseErr) {
          let applicationError = new ApplicationError('disableNotySub', req.user.id, promiseErr.code,
            promiseErr.error, 'Σφάλμα κατα την ενημέρωση εγγραφής.', getClientIp(req), promiseErr.httpCode)
          next(applicationError)
        })
      }
    } else {
      next(new ApplicationError('updateNotySub', req.user.id, 2062, err, 'Το προφιλ χρήστη δεν υπάρχει', getClientIp(req), 500))
    }
  })
}

function enableNotySub (req, res, next) {
  database.Profile.findOne({ldapId: req.user.id}).exec(function (err, profile) {
    if (!err && profile) {
      functions.checkIfSubscribedAlready(req.user.id, req.body.browserFp).then(result => {
        if (result.isSubscribed) {
          return functions.modifyNotySub(result.profile, req.body, true)
        } else {
          return functions.createNewNotySubscription(profile, req.body)
        }
      }).then(() => {
        let log = new Log('enableNotySub', req.user.id, 'Η εγγραφή ενημερώθηκε επιτυχώς', getClientIp(req), 200)
        log.logAction('user')
        res.sendStatus(200)
      }).catch(function (promiseErr) {
        let applicationError = new ApplicationError('enableNotySub', req.user.id, promiseErr.code,
          promiseErr.error, 'Σφάλμα κατα την ενημέρωση εγγραφής.', getClientIp(req), promiseErr.httpCode)
        next(applicationError)
      })
    } else {
      next(new ApplicationError('updateNotySub', req.user.id, 2053, err, 'Το προφιλ χρήστη δεν υπάρχει', getClientIp(req), 500))
    }
  })
}

function getNotySub (req, res) {
  let fp = req.query.fp
  database.Profile.findOne({
    ldapId: req.user.id,
    'notySub.browserFp': fp
  }).select('notySub -_id').exec(function (err, profile) {
    if (profile && !err) {
      let notySubPos = functions.getPositionOfNotySub(profile.notySub, fp)
      res.status(200).json({notySub: profile.notySub[notySubPos]})
    } else {
      res.status(200).json({notySub: null})
    }
  })
}

module.exports = {
  router
}
