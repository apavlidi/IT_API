const express = require('express')
const router = express.Router()

const database = require('../../../configs/database')
const functions = require('./function')
const apiFunctions = require('./../../apiFunctions')
const auth = require('../../../configs/auth')
const config = require('../../../configs/config')
const ApplicationErrorClass = require('./../../applicationErrorClass')
const validSchemas = require('./joi')

router.get('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), getNotySub)
router.patch('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.validateInput('body', validSchemas.enableNotySub), enableNotySub)
router.delete('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.validateInput('body', validSchemas.disableNotySub), disableNotySub)

function disableNotySub (req, res, next) {
  database.Profile.findOne({ldapId: req.user.id}).exec(function (err, profile) {
    if (!err && profile) {
      if (req.body.all && req.body.all === 'true') {
        functions.disableAllNotiesSub(profile).then(() => {
          res.sendStatus(200)
        })
      } else {
        functions.checkIfSubscribedAlready(req.user.id, req.body.browserFp).then(result => {
          functions.modifyNotySub(result.profile, req.body, false).then(() => {
            res.sendStatus(200)
          })
        })
      }
    } else {
      next(new ApplicationErrorClass('updateNotySub', req.user, 77, null, 'Το προφιλ χρήστη δεν υπάρχει', apiFunctions.getClientIp(req), 500))
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
        res.status(200).json()
      })
    } else {
      next(new ApplicationErrorClass('updateNotySub', req.user, 77, null, 'Το προφιλ χρήστη δεν υπάρχει', apiFunctions.getClientIp(req), 500))
    }
  })
}

function getNotySub (req, res) {
  let fp = req.query.fp
  database.Profile.findOne({
    ldapId: req.user.id,
    'notySub.browserFp': fp
  }).select('notySub -_id').exec(function (err, profile) {
    if (profile) {
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