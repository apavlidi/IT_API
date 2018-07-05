const express = require('express')
const router = express.Router()
const PERMISSIONS = require('./../../configs/config').PERMISSIONS
const database = require('../../configs/database')
const Joi = require('joi');
const auth = require('../../configs/auth')
const config = require('../../configs/config')
const apiFunctions = require('../apiFunctions')

router.get('/notificationsUser/:limit?', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), getNotificationsUser)
router.post('/readNotificationsUser', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), readNotificationsUser)

function getNotificationsUser (req, res, next) {
  let notsCounter = req.params.limit
  let limit = null
  let validLimit = true
  if (notsCounter) {
    Joi.validate(notsCounter, Joi.number().integer().min(0), function (err) {
      (!err) ? limit = {
        notifications: {$slice: -notsCounter}
      } : validLimit = false
    })
  }

  if (validLimit) {
    let userId = req.user.id
    database.Profile.findOne({'ldapId': userId}, limit).select('-ldapId -__v -_id -socialMedia').populate('notifications._notification', '-userId -__v -_id').exec(function (err, profile) {
      if (profile) {
        let notifications = profile.notifications
        database.Announcements.populate(notifications, {
          path: '_notification.related.id',
          select: '_about title titleEn'
        }, function (err, doc) {
          let notificationsPopulated = profile.notifications
          console.log(notificationsPopulated)
          console.log('h')
          database.AnnouncementsCategories.populate(notificationsPopulated, {
            path: '_notification.related.id._about',
            select: 'name -_id'
          }, function (err, profilePopulated) {
            if (profilePopulated) {
              res.status(200).json(profile)
            } else {
              res.status(500).json({message: 'To προφίλ χρήστη δεν υπάρχει'})
            }
          })
        })
      } else {
        res.status(500).json({message: 'To προφίλ χρήστη δεν υπάρχει'})
      }
    })
  } else {
    res.status(500).json({message: 'Λάθος εισαγωγή δεδομένων'})
  }
}

function readNotificationsUser (req, res, next) {
  let userId = req.user.id
  database.Profile.findOne({'ldapId': userId}).populate('notifications._notification').exec(function (err, profile) {
    if (profile) {
      profile.notifications.forEach(function (notification) {
        notification.seen = true
      })
      profile.save()
      res.status(200).send()
    } else {
      res.status(500).json({message: 'To προφίλ χρήστη δεν υπάρχει'})
    }
  })
}

module.exports = router