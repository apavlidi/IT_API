const webpush = require('web-push')

const vapidKeys = webpush.generateVAPIDKeys()

webpush.setGCMAPIKey('AAAAau40-NU:APA91bFxjg8vhahzVBx8Q8I7R_E9uY8h7TKJ72GjoNL3HQZqHazUq_kO5qR9YBMBTeELyrbUdQ-gwuzLiBVmo6TEVQr_TKPuYpzhTuVqJCbVEKxFPsTnkECeqWcpMpdtqnFeSFp3hqn_ ')

webpush.setVapidDetails(
  'mailto:your@email.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
)

function sendNotification (notiesSub, announcementEntry, category) {
  notiesSub.forEach(notySub => {
    if (notySub.enabled) {
      let pushSubscription = {
        endpoint: notySub.endpoint,
        keys: {
          auth: notySub.auth,
          p256dh: notySub.p256dh
        }
      }

      webpush.sendNotification(pushSubscription, JSON.stringify({
        title: 'Νέα ανακοίνωση',
        body: 'Ο χρήστης ' + announcementEntry.publisher.name + ' πρόσθεσε μια νέα ανακοίνωση στην κατηγορία ' + category.name,
        icon: 'https://login.it.teithe.gr/img/logoonly.png',
        url: 'https://apps.it.teithe.gr/announcements/announcement/' + announcementEntry._id
      }))
    }
  })
}

module.exports = {
  sendNotification
}
