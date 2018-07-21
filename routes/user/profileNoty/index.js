var express = require('express')
var router = express.Router()

const database = require('../../../configs/database')
const functions = require('./function')
const apiFunctions = require('./../../apiFunctions')
const auth = require('../../../configs/auth')
const config = require('../../../configs/config')
const ApplicationErrorClass = require('./../../applicationErrorClass')
const joi = require('./joi')

router.get('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), getNotySub)
router.patch('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.validateInput('body', joi.enableNotySub), enableNotySub)
router.delete('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.validateInput('body', joi.disableNotySub), disableNotySub)

function disableNotySub (req, res, next) {
  database.Profile.findOne({ldapId: req.user.id}).exec(function (err, profile) {
    if (!err && profile) {
      functions.checkIfSubscribedAlready(req.user.id, req.body.browserFp).then(result => {
        if (req.body.all && req.body.all === 'true') {
          return functions.disableAllNotiesSub(result.profile)
        }
        if (result.isSubscribed) {
          return functions.modifyNotySub(result.profile, req.body, false)
        }
      }).then(() => {
        res.status(200).json()
      })
    } else {
      next(new ApplicationErrorClass('updateNotySub', req.user, 77, null, 'Το προφιλ χρήστη δεν υπάρχει', apiFunctions.getClientIp(req), 500))
    }
  })
}

function enableNotySub (req, res, next) {
  database.Profile.findOne({ldapId: req.user.id}).exec(function (err, profile) {
    if (!err && profile) {
      functions.checkIfSubscribedAlready(req.user.id, req.body.browserFp).then(result => {
        console.log(result.isSubscribed)
        if (result.isSubscribed) {
          console.log('h1')
          return functions.modifyNotySub(result.profile, req.body, true)
        } else {
          console.log('h2')
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
  console.log('h')
  console.log(req.user.id)
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