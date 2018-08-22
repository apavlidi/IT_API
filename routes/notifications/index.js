const express = require('express')
const router = express.Router()
const database = require('../../configs/database')
const auth = require('../../configs/auth')
const config = require('../../configs/config')
const ApplicationError = require('./../applicationErrorClass')
const apiFunctions = require('../apiFunctions')
const getClientIp = require('../apiFunctions').getClientIp
const validSchemas = require('./joi')

router.get('/:limit?', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.formatQuery, apiFunctions.validateInput('params', validSchemas.getNotificationsUser), getNotificationsUser)
router.post('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), readNotificationsUser)

function getNotificationsUser (req, res, next) {
  let notsCounter = req.params.limit
  let limit = null
  if (notsCounter) {
    limit = {
      notifications: {$slice: -notsCounter}
    }
  }

  let userId = req.user.id
  database.Profile.findOne({'ldapId': userId}, limit).select('-ldapId -__v -_id -socialMedia -profilePhoto').populate('notifications._notification', '-userId -__v -_id').exec(function (err, profile) {
    if (profile && !err) {
      let notifications = profile.notifications
      database.Announcements.populate(notifications, {
        path: '_notification.related.id',
        select: '_about title titleEn'
      }, function (err, doc) {
        if (err) {
          next(new ApplicationError('getNotificationsUser', req.user.id, 5002, null, 'To προφίλ χρήστη δεν υπάρχει', getClientIp(req), 500, false))
        } else {
          let notificationsPopulated = profile.notifications
          database.AnnouncementsCategories.populate(notificationsPopulated, {
            path: '_notification.related.id._about',
            select: 'name -_id'
          }, function (err, profilePopulated) {
            if (profilePopulated && !err) {
              res.status(200).json(profile)
            } else {
              next(new ApplicationError('getNotificationsUser', req.user.id, 5000, null, 'To προφίλ χρήστη δεν υπάρχει', getClientIp(req), 500, false))
            }
          })
        }
      })
    } else {
      next(new ApplicationError('getNotificationsUser', req.user.id, 5001, null, 'To προφίλ χρήστη δεν υπάρχει', getClientIp(req), 500, true))
    }
  })
}

function readNotificationsUser (req, res, next) {
  let userId = req.user.id
  database.Profile.findOne({'ldapId': userId}).populate('notifications._notification').exec(function (err, profile) {
    if (profile && !err) {
      profile.notifications.forEach(function (notification) {
        notification.seen = true
      })
      profile.save()
      res.status(200).send()
    } else {
      next(new ApplicationError('readNotificationsUser', req.user.id, 5011, null, 'To προφίλ χρήστη δεν υπάρχει', getClientIp(req), 500))
    }
  })
}

module.exports = {
  router: router
}
