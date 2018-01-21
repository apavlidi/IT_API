const express = require('express')
const router = express.Router()
const database = require('./../../configs/database')
const apiFunctions = require('../apiFunctions')
const announcementsFunctions = require('./functions')
const mongoose = require('mongoose')

const Joi = require('joi')
const validSchemas = require('./joi')

router.get('/', getAnnouncements)
router.get('/:id', getAnnouncement)
router.get('/feed/:type/:categoryIds?', validateInput('params', validSchemas.getAnnouncementFeedSchema), getAnnouncementsFeed)
router.get('/public', getAnnouncementsPublic)
router.post('/', validateInput('body', validSchemas.newAnnouncementsQuerySchema), insertNewAnnouncement)

const login = true
let user = {
  displayNameEn: 'apavlidi',
  displayNameEl: 'apavlidiEl',
  id: '12345'
}

function validateInput (objectToBeValidateStr, schema) {
  return function (req, res, next) {
    let objectToBeValidate = objectToBeValidateStr === 'params' ? req.params : req.body
    apiFunctions.sanitizeObject(objectToBeValidate)
    Joi.validate(objectToBeValidate, schema, function (err) {
      if (!err) {
        next()
      } else {
        console.log(err)
        res.status(500).json({message: 'Σφάλμα κατα την εισαγωγή δεδομένων'})
      }
    })
  }
}

function getAnnouncements (req, res) {
  apiFunctions.formatQuery(req.query).then(function (formatedQuery) {
    database.Announcements.find(formatedQuery.filters).select(formatedQuery.fields).populate('_about',
      'name public').populate('attachments', 'name').sort(formatedQuery.sort).exec(function (err, announcements) {
      if (err) {
        res.status(500).json({message: 'Συνεβη καποιο λάθος κατα την λήψη ανακοινώσεων: \n' + err})
      } else {
        res.status(200).json(announcements)
      }
    })
  }).catch(function () {
    res.status(500).json({message: 'Σφάλμα'})
  })
}

// TODO Replace login check
function getAnnouncement (req, res) {
  let announcementsId = req.params.id
  database.Announcements.findOne({_id: announcementsId}).populate('_about', 'name public').populate('attachments',
    'name').exec(function (err, announcement) {
    if (err) {
      res.status(500).json({message: 'Συνεβη καποιο λάθος κατα την λήψη ανακοίνωσης.'})
    } else {
      if (login || announcement._about.public) {
        res.status(200).json(announcement)
      } else {
        res.status(401).json({message: 'Δεν έχεις δικάιωμα για αυτήν την ενέργεια!'})
      }
    }
  })
}

// by default it returns all public announcements,if id is passed it returns the announcements of the category
// TODO Replace login check
function getAnnouncementsFeed (req, res) {
  let filter
  let feedType = req.params.type

  if (req.params.categoryIds) {
    let categoryIds = req.params.categoryIds.split(',')
    filter = login ? {_id: {$in: categoryIds}} : {value: {$in: categoryIds}, public: true}
  } else {
    filter = login ? {public: true} : {}
  }

  database.AnnouncementsCategories.find(filter).select('_id name').sort([['date', 'descending']]).exec(function (err, rssCategories) {
    if (err || !rssCategories.length) {
      res.status(500).json({message: 'Συνεβη καποιο λάθος κατα την λήψη ανακοινώσεων'})
    } else {
      database.Announcements.find({_about: {$in: rssCategories}}).populate('_about', 'name').populate('attachments',
        'name').exec(function (err, announcements) {
        if (err) {
          res.status(500).json({message: 'Συνεβη καποιο λάθος κατα την λήψη ανακοινώσεων'})
        } else {
          announcementsFunctions.getAnnouncementsRSSPromise(announcements, rssCategories, req.params.categoryIds,
            feedType, res, login).then(function (response) {
            res.send(response)
          }).catch(function () {
            res.status(500).json({message: 'Σφάλμα κατα την δημιουργεία RSS'})
          })
        }
      })
    }
  })
}

function getAnnouncementsPublic (req, res, next) {
  database.AnnouncementsCategories.find({public: true}).select('_id').exec(function (err, publicCategories) {
    if (err) {
      res.status(500).json({message: 'Συνεβη καποιο λάθος κατα την λήψη ανακοινώσεων: \n' + err})
    } else {
      database.Announcements.find({_about: {$in: publicCategories}}).populate('_about', 'name').populate('attachments', 'name').exec(function (err, announcements) {
        if (err) {
          res.status(500).json({message: 'Συνεβη καποιο λάθος κατα την λήψη ανακοινώσεων: \n' + err})
        } else {
          res.status(200).json(announcements)
        }
      })
    }
  })
}

function insertNewAnnouncement (req, res) {
  let files
  let announcementEntry = new database.Announcements()
  let announcementId = mongoose.Types.ObjectId()
  let publisher = {nameEn: user.displayName, id: user.id, nameEl: user.displayNameEl}
  announcementEntry._id = announcementId
  announcementEntry.title = req.body.title
  announcementEntry.text = req.body.text
  announcementEntry.textEn = req.body.textEn || req.body.text
  announcementEntry.titleEn = req.body.titleEn || req.body.title
  announcementEntry.publisher.name = publisher.nameEn
  announcementEntry.publisher.id = publisher.id

  let validatePublisherPromise = Promise.resolve(false) // initialize a promise as false
  if (req.body.publisher) { // TODO && req.session.user.scope >= PERMISSIONS.futureUseSix
    validatePublisherPromise = announcementsFunctions.validatePublisher(req.body.publisher.publisherId) // if he sent a publisher we have to check it with a request to the ldap api
  }

  announcementsFunctions.gatherFilesInput(req.files).then(filesReturned => {
    files = filesReturned
    return announcementsFunctions.checkIfCategoryExists(req.body.about)
  }).then(() => {
    announcementEntry._about = mongoose.Types.ObjectId(req.body.about)
    return announcementsFunctions.createFileEntries(files, announcementId)
  }).then(fileIds => {
    announcementEntry.attachments = fileIds
    return validatePublisherPromise
  }).then(validationResult => {
    if (validationResult) {
      publisher = {
        nameEn: req.body.publisher.publisherName,
        id: req.body.publisher.publisherId,
        nameEl: req.body.publisher.publisherName
      }
      announcementEntry.publisher.name = publisher.nameEn
      announcementEntry.publisher.id = publisher.id
    }
    announcementEntry.save(function (err, newAnnouncement) {
      // announcementsFunctions.postToTeithe(announcementEntry)
      // announcementsFunctions.sendEmails(announcementEntry)

      announcementsFunctions.createNotification(newAnnouncement._id, publisher).then(newNotification => {
        announcementsFunctions.sendNotifications(announcementEntry, newNotification.id, publisher.id).then(function () {
          req.app.io.emit('new announcement', newNotification)
        })
      })
      //             // let logEntry = logging(req.session.user.id, 'NEW', 'success', 'announcements', {
      //             //   track: 'insertNewAnnouncement',
      //             //   text: 'Η ανακοίνωση προστέθηκε επιτυχώς με id: ' + newAnnouncement._id
      //             // }, req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress)
      //             // log.info(logEntry)

      res.status(201).json({
        message: 'Η ανακοίνωση προστέθηκε επιτυχώς',
        newAnnouncement
      })
    })
  })
    .catch(function (err) {
      // let logEntry = logging(req.session.user.id, 'NEW', 'fail', 'announcements', {
      //   error: err,
      //   track: 'insertNewAnnouncement',
      //   text: 'Σφάλμα κατα την αποθήκευση αρχείων στην βάση'
      // }, req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress)
      // log.error(logEntry)
      res.status(500).json({message: 'Σφάλμα κατα την αποθήκευση αρχείων στην βάση'})
    })
}

// function logging (user, action, status, ref, info, ip) {
//   return {
//     user: user,
//     action: action,
//     status: status,
//     ref: ref,
//     info: info,
//     ip: ip
//   }
// }

module.exports = {
  router: router
}
