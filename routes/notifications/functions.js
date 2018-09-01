const database = require('../../configs/database')
const PromiseError = require('../promiseErrorClass')
const async = require('async')
const mongoose = require('mongoose')

function createNotification (announcementId, publisher) {
  return new Promise((resolve, reject) => {
    let notification = new database.Notification()
    notification.userId = publisher.id
    notification.nameEn = publisher.nameEn
    notification.nameEl = publisher.nameEl
    if (mongoose.Types.ObjectId.isValid(announcementId)) {
      notification.related.id = announcementId
    } else {
      reject(new PromiseError(1057, null))
    }
    notification.save(function (err, newNotification) {
      if (err) {
        reject(new PromiseError(1058, err))
      } else {
        resolve(newNotification)
      }
    })
  })
}

function sendNotifications (announcementEntry, notificationId, publisherId) {
  return new Promise((resolve, reject) => {
    let calls = []
    database.AnnouncementsCategories.findOne({_id: announcementEntry._about}).exec(function (err, category) {
      if (err || !category) {
        reject(new PromiseError(1061, err))
      }

      category.registered.forEach(function (id) {
        calls.push(function (callback) {
          database.Profile.findOne({
            'ldapId': {$eq: id, $ne: publisherId}
          }).exec(function (err, profile) {
            if (!err && profile) {
              // TODO THIS NEEDS TO BE CHECKED WHEN USER IS IMPLEMENTED
              // sendPush.sendNotification(profile.notySub, announcementEntry, category)
            }
          })

          database.Profile.update({'ldapId': {$eq: id, $ne: publisherId}}, {
            '$addToSet': {
              'notifications': {_notification: notificationId, seen: false}
            }
          }, function (err, updated) {
            if (err) {
              reject(new PromiseError(1059, err))
            }
            callback(null)
          })
        })
      })

      async.parallel(calls, function (err) {
        if (err) {
          reject(new PromiseError(1060, err))
        }
        resolve()
      })
    })
  })
}

module.exports = {
  createNotification,
  sendNotifications
}
