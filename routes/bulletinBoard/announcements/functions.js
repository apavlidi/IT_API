const Feed = require('feed')
const async = require('async')
const mongoose = require('mongoose')
const database = require('../../../configs/database')
const fileChecks = require('./fileChecks')
const wordpress = require('wordpress')
const WORDPRESS_CREDENTIALS = require('../../../configs/config').WORDPRESS_CREDENTIALS
const WEB_BASE_URL = require('../../../configs/config').WEB_BASE_URL
const MAIL = require('../../../configs/config').MAIL
const ldapConfig = require('../../../configs/config')
const ldap = require('ldapjs')
const filter = require('ldap-filters')
const sendPush = require('./sendPush')

const clientWordpress = wordpress.createClient(WORDPRESS_CREDENTIALS)
const client = ldap.createClient({
  url: ldapConfig.LDAP[process.env.NODE_ENV].host
})

function getAnnouncementsRSSPromise (announcements, rssCategories, categoryValues, feedType, res, isAuthenticated) {
  return new Promise(
    function (resolve, reject) {
      let calls = []
      let descriptionRSS
      if (categoryValues) {
        descriptionRSS = 'Ανακοινώσεις για τις παρακάτω κατηγορίες: '
        rssCategories.forEach(category => {
          descriptionRSS += category.name + ', '
        })
        descriptionRSS = descriptionRSS.substr(0, descriptionRSS.lastIndexOf(','))
      } else {
        descriptionRSS = isAuthenticated ? 'Όλες οι ανακοινώσεις' : 'Όλες οι δημόσιες ανακοινώσεις'
      }
      let feed = new Feed({
        title: 'Τμήμα Πληροφορικής - Ανακοινώσεις',
        id: 'https://apps.it.teithe.gr/',
        description: descriptionRSS,
        generator: 'Feed for Apps',
        link: 'https://apps.it.teithe.gr/announcements',
        copyright: 'All rights reserved 2017, Alexis Pavlidis',
        feedLinks: {
          atom: '/api/announcements/feed/atom',
          rss: 'https://apps.it.teithe.gr/api/announcements/feed/rss'
        },
        author: {
          name: 'Alexis Pavlidis'
        }
      })

      announcements.forEach(function (announcement) {
        calls.push(function (callback) {
          feed.addItem({
            title: announcement.title,
            description: announcement._about.name,
            link: 'https://apps.it.teithe.gr/announcements/announcement/' + announcement._id,
            id: 'https://apps.it.teithe.gr/announcements/announcement/' + announcement._id,
            content: announcement.text,
            author: [{
              name: announcement.publisher.name
            }],
            contributor: [],
            date: announcement.date
          })
          callback(null)
        })
      })

      async.parallel(calls, function (err) {
        if (err) {
          reject(err)
        }
        let response
        switch (feedType) {
          case 'rss':
            res.set('Content-Type', 'text/xml')
            response = feed.rss2()
            break
          case 'json' :
            res.setHeader('Content-Type', 'application/json')
            response = feed.json1()
            break
          default:
            res.set('Content-Type', 'text/plain')
            response = feed.atom1()
        }
        resolve(response)
      })
    })
}

// TODO Check if publisher exists
function validatePublisher (publisherId) {
  return new Promise(
    function (resolve, reject) {
      // request.get({
      //   url: WEB_BASE_URL.url + '/api/user/all/' + publisherId,
      //   agentOptions: {rejectUnauthorized: false}
      // }, function (error, response, body) {
      //   if (error) {
      //     resolve(false);
      //   }
      //   else {
      //     let parsed = JSON.parse(body);
      //     if (parsed && parsed.length === 0) {
      //       resolve(false);
      //     } else {
      //       resolve(true);
      //     }
      //   }
      // });
      resolve(true)
    })
}

function createFileEntries (files, announcementId) {
  return new Promise(
    function (resolve, reject) {
      let calls = []
      let filesIds = []

      files.forEach(function (file) {
        calls.push(function (callback) {
          let newFile = new database.File()
          let fileId = mongoose.Types.ObjectId()
          newFile.name = file.name
          newFile._id = fileId
          newFile.contentType = file.mimetype
          newFile.data = file.data
          newFile._announcement = announcementId
          newFile.save(function (err, newFile) {
            if (err) {
              reject(err)
            }
            filesIds.push(newFile._id)
            callback(null)
          })
        })
      })

      async.parallel(calls, function (err) {
        if (err) {
          reject(err)
        }
        resolve(filesIds)
      })
    })
}

function checkIfCategoryExists (categoryId) {
  return new Promise(
    function (resolve, reject) {
      database.AnnouncementsCategories.findOne({_id: categoryId}, function (err, category) {
        if (err || !category) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
}

function gatherFilesInput (filesInput) {
  return new Promise(
    function (resolve, reject) {
      let files = []
      if (filesInput) {
        let upload = filesInput['uploads[]']
        if (Array.isArray(upload)) { // if multiple files are uploaded
          upload.forEach(file => {
            if (checkFileInput(file)) {
              files.push(file)
            }
          })
        } else {
          if (checkFileInput(upload)) {
            files.push(upload)
          }
        }
      }
      resolve(files)
    })
}

function checkFileInput (file) {
  return (file && fileChecks.checkFileType(file.mimetype) && fileChecks.validateFileSize(Buffer.byteLength(file.data))
  )
}

function postToTeithe (newAnnouncement) {
  database.AnnouncementsCategories.findOne({_id: newAnnouncement._about}).exec(function (err, category) {
    if (category && category.public) {
      generateWordpressContent(newAnnouncement.id, newAnnouncement.text, newAnnouncement.textEn, newAnnouncement.attachments, newAnnouncement.date, newAnnouncement.publisher.name).then(function (wordpressContent) {
        clientWordpress.newPost({
          title: '<!--:el-->' + newAnnouncement.title + '<!--:--><!--:en-->' + newAnnouncement.titleEn + '<!--:-->',
          content: wordpressContent,
          status: 'publish',
          terms: {
            'category': [category.wid]
          }
        }, function (error, id) {
          database.Announcements.findOneAndUpdate({_id: newAnnouncement._id}, {
            $set: {
              wordpressId: id
            }
          }, function (err, categoryUpdated) {

          })
        })
      })
    }
  })
}

function sendEmails (announcementEntry) {
  let sender = announcementEntry.publisher
  let categoryName
  database.AnnouncementsCategories.findOne({_id: announcementEntry._about}).select('name registered -_id').exec(function (err, category) {
    console.log('Reg users from db = ' + category.registered)
    categoryName = category.name
    findEmailsFromUserIds(category.registered).then(function (emails, err) {
      console.log('Mail All = ' + emails)
      console.log('Mail Error finding = ' + err)
      if (emails.length) {
        let bodyText = buildEmailBody(sender.name, announcementEntry.text, announcementEntry.title, categoryName, WEB_BASE_URL.url + '/announcements/announcement/' + announcementEntry.id)
        async.forEach(emails, function (to) {
          let mailOptions = {
            from: '"IT-News (' + sender.name + ')" <notify@eng.it.teithe.gr>', // sender address
            to: to,
            subject: '[Apps-News] ' + categoryName + ': ' + announcementEntry.title, // Subject line
            html: bodyText // html body
          }
          MAIL.sendMail(mailOptions, (error, info) => {
            if (error) {
              return error
            }
          })
        }, function (err) {
        })
      }
    })
  })
}

function buildEmailBody (publisher, text, title, categoryName, link) {
  let textToHTML = decodeURIComponent(text).replace(/(?:\r\n|\r|\n)/g, '<br />') // convert to html so it prints line breaks correct
  return 'Μια νεα ανακοίνωση δημιουργήθηκε απο "' + publisher + '" στην κατηγορία " ' + categoryName + '" <br/>' +
    'Ο τίτλος της ανακοίνωσης ειναι: ' + title + '<br/><br/>' +
    'Σύνδεσμος : ' + link + '<br/><br/>' +
    textToHTML + '<br></br>' +
    ''
}

function findEmailsFromUserIds (registeredIds) {
  return new Promise(
    function (resolve, reject) {
      let emails = []
      let searchAttr = []
      registeredIds.forEach(function (id) {
        searchAttr.push(filter.attribute('id').equalTo(id))
      })
      let output = filter.OR(searchAttr)
      let opts = {
        filter: output.toString(),
        scope: 'sub',
        paged: {
          pageSize: 250,
          pagePause: false
        },
        attributes: ['mail', 'id']
      }
      client.search(ldapConfig.LDAP[process.env.NODE_ENV].baseUserDN, opts, function (err, results) {
        if (err) {
          reject(err)
        }
        results.on('searchEntry', function (entry) {
          let tmp = entry.object
          delete tmp.controls
          delete tmp.dn
          if (tmp.status !== 0) {
            emails.push(tmp.mail + '')
          }
        })
        results.on('error', function (err) {
          reject(err)
        })
        results.on('end', function (result) {
          resolve(emails)
        })
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
            'ldapId': {
              $eq: id,
              $ne: publisherId
            }
          }).select('notySub -_id').exec(function (err, profile) {
            if (!err) {
              if (profile) {
                sendPush.sendNotification(profile.notySub, announcementEntry, category)
              }
            }
          })

          database.Profile.update({'ldapId': {$eq: id, $ne: publisherId}}, {
            '$addToSet': {
              'notifications': {
                _notification: notificationId,
                seen: false
              }
            }
          }, function (err, updated) {
            if (err) {
              reject(err)
            }
            callback(null)
          })
        })
      })

      async.parallel(calls, function (err) {
        if (err) {
          reject(err)
        }
        resolve()
      })
    })
  })
}

function generateWordpressContent (newAnnouncementId, text, textEn, attachments, date, publisher) {
  return new Promise((resolve, reject) => {
    let buildAttachmentsHtml = new Promise((resolve, reject) => {
      let calls = []
      let attachmentsHtml = ''
      if (attachments) {
        for (let i = 0; i < attachments.length; i++) {
          calls.push(function (callback) {
            database.File.findOne({_id: attachments[i]}).exec(function (err, file) {
              if (file) {
                attachmentsHtml += 'Επισύναψη: <a href="' + WEB_BASE_URL.url + '/api/announcements/' + newAnnouncementId + '/download/' + attachments[i] + '">' + file.name + '</a><br/>'
              }
              callback(null)
            })
          })
        }
      }
      async.parallel(calls, function (err) {
        if (err) {
          reject(err)
        }
        resolve(attachmentsHtml)
      })
    })

    buildAttachmentsHtml.then(function (attachmentsHtml) {
      let isoDate = new Date(date)
      let dateModified = formatDate(isoDate, true)

      let htmlContentEl = '<!--:el-->' + text + '<br/>' + attachmentsHtml + dateModified + ' - από ' + publisher + '<!--:-->'
      let htmlContentEn = '<!--:en-->' + textEn + '<br/>' + attachmentsHtml + dateModified + ' - από ' + publisher + '<!--:-->'
      resolve(htmlContentEl + htmlContentEn)
    })
  })
}

function formatDate (date, monthString) {
  let monthNames = [
    'Ιαν', 'Φεβ', 'Μαρτ',
    'Απριλ', 'Μάι', 'Ιούν', 'Ιούλ',
    'Αυγ', 'Σεπτ', 'Οκτώ',
    'Νοέ', 'Δεκ'
  ]

  let day = date.getDate()
  let monthIndex = date.getMonth()
  let year = date.getFullYear()
  let hour = date.getHours()
  let minute = date.getMinutes()

  return monthString ? (day + ' ' + monthNames[monthIndex] + ' ' + year + ' ' + hour + ':' + minute) : (day + '/' + monthIndex + '/' + year + ' ' + hour + ':' + minute)
}

function createNotification (announcementId, publisher) {
  return new Promise((resolve, reject) => {
    let notification = new database.Notification()
    notification.userId = publisher.id
    notification.nameEn = publisher.nameEn
    notification.nameEl = publisher.nameEl
    notification.related.id = announcementId
    notification.save(function (err, newNotification) {
      if (err) {
        reject(err)
      }
      resolve(newNotification)
    })
  })
}

module.exports = {
  getAnnouncementsRSSPromise,
  validatePublisher,
  createFileEntries,
  checkIfCategoryExists,
  gatherFilesInput,
  postToTeithe,
  sendEmails,
  sendNotifications,
  createNotification
}
