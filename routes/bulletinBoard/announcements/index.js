const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const wordpress = require('wordpress')

const database = require('../../../configs/database')
const apiFunctions = require('../../apiFunctions')
const announcementsFunc = require('./functions')
const auth = require('../../../configs/auth')
const config = require('../../../configs/config')
const validSchemas = require('../joi')
const WORDPRESS_CREDENTIALS = require('./../../../configs/config').WORDPRESS_CREDENTIALS
const clientWordpress = wordpress.createClient(WORDPRESS_CREDENTIALS)
const ApplicationErrorClass = require('../../applicationErrorClass')

router.get('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.formatQuery, getAnnouncements)
router.get('/public', apiFunctions.formatQuery, getAnnouncementsPublic)
router.get('/:id', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student, true), apiFunctions.formatQuery, getAnnouncement)
router.get('/feed/:type/:categoryIds?', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student, true), apiFunctions.validateInput('params', validSchemas.getAnnouncementFeedSchema), getAnnouncementsFeed)
router.post('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.professor), apiFunctions.validateInput('body', validSchemas.newAnnouncementsQuerySchema), insertNewAnnouncement)
router.patch('/:id', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.professor), apiFunctions.validateInput('body', validSchemas.editAnnouncementsQuerySchema), editAnnouncement)
router.delete('/:id', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.professor), deleteAnnouncement)

function getAnnouncements (req, res, next) {
  database.Announcements.find(req.query.filters).select(req.query.fields).sort(req.query.sort).skip(parseInt(req.query.page) * parseInt(req.query.limit)).limit(parseInt(req.query.limit)).exec(function (err, announcements) {
    if (err || !announcements) {
      next(new ApplicationErrorClass('getAnnouncements', null, 100, err, 'Συνεβη καποιο λάθος κατα την λήψη ανακοινώσεων.', apiFunctions.getClientIp(req), 500))
    } else {
      res.status(200).json(announcements)
    }
  })
}

function getAnnouncement (req, res, next) {
  let announcementsId = req.params.id
  database.Announcements.findOne({_id: announcementsId}).populate('_about', 'public').select(req.query.fields).exec(function (err, announcement) {
    if (err || !announcement) {
      next(new ApplicationErrorClass('getAnnouncement', null, 140, err, 'Συνεβη καποιο λάθος κατα την λήψη ανακοινώσεων.', apiFunctions.getClientIp(req), 500))
    } else {
      announcementsFunc.checkIfEntryExists(announcement._about, database.AnnouncementsCategories).then(() => {
        if (req.user || announcement._about.public) {
          announcement._about.public = undefined //remove the public property
          if (req.query.fields && req.query.fields.indexOf('_about') === -1) {
            announcement._about = undefined //remove the _about property if its not on query
          }
          res.status(200).json(announcement)
        } else {
          next(new ApplicationErrorClass('getAnnouncement', null, 101, err, 'Δεν έχεις δικάιωμα για αυτήν την ενέργεια!', apiFunctions.getClientIp(req), 401))
        }
      }).catch(next)
    }
  })
}

function getAnnouncementsFeed (req, res, next) {
  let filter
  let feedType = req.params.type
  let login = req.user != null

  if (req.params.categoryIds) {
    let categoryIds = req.params.categoryIds.split(',')
    filter = login ? {_id: {$in: categoryIds}} : {_id: {$in: categoryIds}, public: true}
  } else {
    filter = login ? {} : {public: true}
  }

  database.AnnouncementsCategories.find(filter).select('_id name').sort([['date', 'descending']]).exec(function (err, rssCategories) {
    if (err || !rssCategories.length) {
      next(new ApplicationErrorClass('getAnnouncementsFeed', 'unknown', 102, err, 'Συνεβη καποιο λάθος κατα την λήψη ανακοινώσεων.', apiFunctions.getClientIp(req), 500))
    } else {
      database.Announcements.find({_about: {$in: rssCategories}}).populate('_about', 'name').populate('attachments',
        'name').exec(function (err, announcements) {
        if (err) {
          next(new ApplicationErrorClass('getAnnouncementsFeed', 'unknown', 103, err, 'Συνεβη καποιο λάθος κατα την λήψη ανακοινώσεων!', apiFunctions.getClientIp(req), 500))
        } else {
          announcementsFunc.getAnnouncementsRSSPromise(announcements, rssCategories, req.params.categoryIds,
            feedType, res, login).then(function (response) {
            res.send(response)
          }).catch(function (err) {
            next(new ApplicationErrorClass('getAnnouncementsFeed', 'unknown', 104, err, 'Συνεβη καποιο λάθος κατα την λήψη ανακοινώσεων!', apiFunctions.getClientIp(req), 500))
          })
        }
      })
    }
  })
}

function getAnnouncementsPublic (req, res, next) {
  database.AnnouncementsCategories.find({public: true}).select('_id').exec(function (err, publicCategories) {
    if (err) {
      next(new ApplicationErrorClass('getAnnouncementsPublic', null, 105, err, 'Συνεβη καποιο λάθος κατα την λήψη ανακοινώσεων', apiFunctions.getClientIp(req), 500))
    } else {
      database.Announcements.find({$and: [{_about: {$in: publicCategories}}, req.query.filters]}).select(req.query.fields).sort(req.query.sort).skip(parseInt(req.query.page) * parseInt(req.query.limit)).limit(parseInt(req.query.limit)).exec(function (err, announcements) {
        if (err) {
          next(new ApplicationErrorClass('getAnnouncementsPublic', null, 106, err, 'Συνεβη καποιο λάθος κατα την λήψη ανακοινώσεων', apiFunctions.getClientIp(req), 500))
        } else {
          res.status(200).json(announcements)
        }
      })
    }
  })
}

//TODO CHECK WHEN SENDING OTHER PUBLISHER
function insertNewAnnouncement (req, res, next) {
  let files
  let filesInput
  let announcementId = mongoose.Types.ObjectId()
  let publisher = {name: req.user.displayName, id: req.user.id}
  let announcementEntry = new database.Announcements({
    _id: announcementId,
    title: req.body.title,
    text: req.body.text,
    textEn: req.body.textEn || req.body.text,
    titleEn: req.body.titleEn || req.body.title,
    publisher: publisher
  })
  let validatePublisherPromise = Promise.resolve(false) // initialize a promise as false
  if (req.body.publisher && req.user.scope >= config.PERMISSIONS.futureUseSix) {
    validatePublisherPromise = announcementsFunc.validatePublisher(req.body.publisher.publisherId)
  }

  req.files != null ? filesInput = req.files['uploads'] : null
  announcementsFunc.gatherFilesInput(filesInput).then(filesReturned => {
    files = filesReturned
    return announcementsFunc.checkIfEntryExists(req.body.about, database.AnnouncementsCategories)
  }).then(() => {
    announcementEntry._about = mongoose.Types.ObjectId(req.body.about)
    return announcementsFunc.createFileEntries(files, announcementId)
  }).then(fileIds => {
    announcementEntry.attachments = fileIds
    return validatePublisherPromise
  }).then(validationResult => {
    if (validationResult) {
      publisher = {
        name: req.body.publisher.publisherName,
        id: req.body.publisher.publisherId
      }
      announcementEntry.publisher.name = publisher.nameEn
      announcementEntry.publisher.id = publisher.id
    }
    return announcementEntry.save()
  }).then(newAnnouncement => {
    return announcementsFunc.createNotification(newAnnouncement._id, publisher)
  }).then(newNotification => {
    return announcementsFunc.sendNotifications(announcementEntry, newNotification.id, publisher.id)
  }).then(newNotification => {
    announcementsFunc.postToTeithe(announcementEntry, 'create')
    //TODO ENABLE SEND EMAILS
    //announcementsFunc.sendEmails(announcementEntry);
    req.app.io.emit('new announcement', newNotification)
    res.status(201).json({
      message: 'Η ανακοίνωση προστέθηκε επιτυχώς',
      announcementEntry
    })
  }).catch(function (applicationError) {
    applicationError.type = 'insertNewAnnouncement'
    applicationError.text = 'Σφάλμα κατα την δημιουργία ανακοίνωσης.'
    applicationError.user = req.user.id
    applicationError.ip = apiFunctions.getClientIp(req)
    next(applicationError)
  })
}

function deleteAnnouncement (req, res, next) {
  let announcementId = req.params.id
  database.Announcements.findOne({_id: announcementId}).exec(function (err, announcement) {
    if (err || !announcement) {
      next(new ApplicationErrorClass('deleteAnnouncement', req.user.id, 113, err, 'Συνέβη κάποιο σφάλμα κατα την διαγραφή ανακοίνωσης', apiFunctions.getClientIp(req), 500))
    } else {
      if (announcement.publisher.id === req.user.id || req.user.eduPersonScopedAffiliation === config.PERMISSIONS.admin) {
        announcement.remove(function (err, announcementDeleted) {
          if (err) {
            next(new ApplicationErrorClass('deleteAnnouncement', req.user.id, 114, err, 'Συνέβη κάποιο σφάλμα κατα την διαγραφή ανακοίνωσης', apiFunctions.getClientIp(req), 500))
          } else {
            //logging
            // next(new ApplicationErrorClass('info', 'unknown', 'DELETE', 'success', 'announcements', err, 'deleteAnnouncement',
            //   'H ανακοίνωση διαγράφηκε επιτυχώς με id: ' + announcementId, req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress))
            clientWordpress.deletePost(announcement.wordpressId, function (error, data) {})
            res.status(200).json({
              message: 'H ανακοίνωση διαγράφηκε επιτυχώς',
              announcementDeleted
            })
          }
        })
      } else {
        next(new ApplicationErrorClass('deleteAnnouncement', null, 115, err, 'Δεν έχεις δικάιωμα για αυτήν την ενέργεια!', apiFunctions.getClientIp(req), 401))
        // let logEntry = logging(req.session.user.id, 'DELETE', 'fail', 'announcements', {
        //   track: 'deleteAnnouncement',
        //   text: 'Μη εξουσιοδοτημένος χρήστης'
        // }, req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress)
        // log.error(logEntry)
      }
    }
  })
}

function editAnnouncement (req, res, next) {
  let files
  let about
  let announcementToBeEdited
  let updatedAnnouncement = {}
  let requestedFiles

  (req.files && req.files['uploadsEdit']) ? requestedFiles = req.files['uploadsEdit'] : requestedFiles = null
  announcementsFunc.gatherFilesInput(requestedFiles).then(filesReturned => {
    files = filesReturned
    return announcementsFunc.checkIfEntryExists(req.params.id, database.Announcements)
  }).then(announcement => {
    announcementToBeEdited = announcement
    if (!(announcement.publisher.id === req.user.id || req.user.eduPersonScopedAffiliation === config.PERMISSIONS.admin)) {
      next(new ApplicationErrorClass('editAnnouncement', req.user.id, 111, null, 'Δεν εχετε δικαίωμα επεξεργασίας.', apiFunctions.getClientIp(req), 401))
    }
    return announcementsFunc.createFileEntries(files, announcementToBeEdited._id)
  }).then(fileIds => {
    if (files.length > 0) {
      fileIds.forEach(fileId => {
        announcementToBeEdited.attachments.push(fileId)
      })
    }
    updatedAnnouncement._id = announcementToBeEdited._id
    updatedAnnouncement.date = announcementToBeEdited.date
    updatedAnnouncement.publisher = announcementToBeEdited.publisher
    updatedAnnouncement.attachments = announcementToBeEdited.attachments
    updatedAnnouncement.text = req.body.text
    updatedAnnouncement.title = req.body.title
    updatedAnnouncement.titleEn = req.body.titleEn || updatedAnnouncement.titleEn
    updatedAnnouncement.textEn = req.body.textEn || announcementToBeEdited.textEn
    mongoose.Types.ObjectId.isValid(req.body.about) ? about = req.body.about : about = announcementToBeEdited._about
    return announcementsFunc.checkIfEntryExists(about, database.AnnouncementsCategories)
  }).then(category => {
    (category) ? updatedAnnouncement._about = mongoose.Types.ObjectId(category._id) : updatedAnnouncement._about = announcementToBeEdited._about
    database.Announcements.update({_id: req.params.id},
      updatedAnnouncement
    ).exec(function (err) {
      if (err) {
        next(new ApplicationErrorClass('editAnnouncement', req.user.id, 112, null, 'Συνέβη κάποιο σφάλμα κατα την επεξεργασία ανακοίνωσης', null, 500))
      } else {
        database.AnnouncementsCategories.findOne({_id: announcementToBeEdited._about}, function (err, categoryOld) {
          if (category.public && categoryOld.public) {
            announcementsFunc.postToTeithe(updatedAnnouncement, 'edit')
          } else if (category.public) {
            announcementsFunc.postToTeithe(updatedAnnouncement, 'create')
          } else if (!category.public && categoryOld.public) {
            clientWordpress.deletePost(announcementToBeEdited.wordpressId, function (error, data) {
            })
          }
        })
        res.status(201).json({
          message: 'Η ανακοίνωση αποθηκεύτηκε επιτυχώς'
        })
      }
    })
  }).catch(function (applicationError) {
    applicationError.type = 'editAnnouncement'
    applicationError.text = 'Σφάλμα κατα την επεργασία ανακοίνωσης.'
    applicationError.user = req.user.id
    applicationError.ip = apiFunctions.getClientIp(req)
    next(applicationError)
  })
}

module.exports = {
  router: router
}