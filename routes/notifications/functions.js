const database = require('../../configs/database')
const ApplicationErrorClass = require('../applicationErrorClass')

function createNotification (announcementId, publisher) {
  return new Promise((resolve, reject) => {
    let notification = new database.Notification()
    notification.userId = publisher.id
    notification.nameEn = publisher.nameEn
    notification.nameEl = publisher.nameEl
    notification.related.id = announcementId
    notification.save(function (err, newNotification) {
      if (err) {
        reject(new ApplicationErrorClass(null, null, 108, err, null, null, 500))
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
      category.registered.forEach(function (id) {
        calls.push(function (callback) {
          database.Profile.findOne({
            'ldapId': {$eq: id, $ne: publisherId}
          }).exec(function (err, profile) {
            if (!err && profile) {
              //TODO THIS NEEDS TO BE CHECKED WHEN USER IS IMPLEMENTED
              //sendPush.sendNotification(profile.notySub, announcementEntry, category)
            }
          })

          database.Profile.update({'ldapId': {$eq: id, $ne: publisherId}}, {
            '$addToSet': {
              'notifications': {_notification: notificationId, seen: false}
            }
          }, function (err, updated) {
            if (err) {
              reject(new ApplicationErrorClass('insertNewAnnouncement', null, 109, err, 'Σφάλμα κατα την δημιουργία ανακοίνωσης.', null, 500))
            }
            callback(null)
          })
        })
      })

      async.parallel(calls, function (err) {
        if (err) {
          reject(new ApplicationErrorClass('insertNewAnnouncement', null, 110, err, 'Σφάλμα κατα την δημιουργία ανακοίνωσης.', null, 500))
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