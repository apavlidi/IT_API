const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const wordpress = require('wordpress')

const database = require('../../../configs/database')
const apiFunctions = require('../../apiFunctions')
const getClientIp = require('../../apiFunctions').getClientIp
const announcementsFunc = require('./functions')
const notificationsFunc = require('../../notifications/functions')
const auth = require('../../../configs/auth')
const config = require('../../../configs/config')
const validSchemas = require('../joi')
const WORDPRESS_CREDENTIALS = require('./../../../configs/config').WORDPRESS_CREDENTIALS
const clientWordpress = wordpress.createClient(WORDPRESS_CREDENTIALS)
const ApplicationError = require('../../applicationErrorClass')
const Log = require('../../logClass')

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
      next(new ApplicationError('getAnnouncements', null, 1000, err, 'Συνεβη καποιο λάθος κατα την λήψη ανακοινώσεων.', getClientIp(req), 500, false))
    } else {
      res.status(200).json(announcements)
    }
  })
}

function getAnnouncement (req, res, next) {
  let announcementsId = req.params.id
  database.Announcements.findOne({_id: announcementsId}).populate('_about', 'public').select(req.query.fields).exec(function (err, announcement) {
    if (err || !announcement) {
      next(new ApplicationError('getAnnouncement', null, 1021, err, 'Συνεβη καποιο λάθος κατα την λήψη ανακοινώσεων.', getClientIp(req), 500, false))
    } else {
      announcementsFunc.checkIfEntryExists(announcement._about, database.AnnouncementsCategories).then(() => {
        if (req.user || announcement._about.public) {
          announcement._about.public = undefined // remove the public property
          if (req.query.fields && req.query.fields.indexOf('_about') === -1) {
            announcement._about = undefined // remove the _about property if its not on query
          }
          res.status(200).json(announcement)
        } else {
          next(new ApplicationError('getAnnouncement', null, 1022, err, 'Δεν έχεις δικάιωμα για αυτήν την ενέργεια!', getClientIp(req), 401, false))
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
      next(new ApplicationError('getAnnouncementsFeed', null, 1031, err, 'Συνεβη καποιο λάθος κατα την λήψη ανακοινώσεων.', getClientIp(req), 500, false))
    } else {
      database.Announcements.find({_about: {$in: rssCategories}}).populate('_about', 'name').populate('attachments',
        'name').exec(function (err, announcements) {
        if (err) {
          next(new ApplicationError('getAnnouncementsFeed', null, 1032, err, 'Συνεβη καποιο λάθος κατα την λήψη ανακοινώσεων!', getClientIp(req), 500, false))
        } else {
          announcementsFunc.getAnnouncementsRSSPromise(announcements, rssCategories, req.params.categoryIds,
            feedType, res, login).then(function (response) {
            res.send(response)
          }).catch(function (err) {
            next(new ApplicationError('getAnnouncementsFeed', null, 1033, err, 'Συνεβη καποιο λάθος κατα την λήψη ανακοινώσεων!', getClientIp(req), 500, false))
          })
        }
      })
    }
  })
}

function getAnnouncementsPublic (req, res, next) {
  database.AnnouncementsCategories.find({public: true}).select('_id').exec(function (err, publicCategories) {
    console.log(publicCategories)
    if (err) {
      next(new ApplicationError('getAnnouncementsPublic', null, 1011, err, 'Συνεβη καποιο λάθος κατα την λήψη ανακοινώσεων', getClientIp(req), 500, false))
    } else {
      database.Announcements.find({$and: [{_about: {$in: publicCategories}}, req.query.filters]})
        .select(req.query.fields).sort(req.query.sort)
        .skip(parseInt(req.query.page) * parseInt(req.query.limit))
        .limit(parseInt(req.query.limit)).exec(function (err, announcements) {
          if (err) {
            next(new ApplicationError('getAnnouncementsPublic', null, 1012, err, 'Συνεβη καποιο λάθος κατα την λήψη ανακοινώσεων', getClientIp(req), 500, false))
          } else {
            res.status(200).json(announcements)
          }
        })
    }
  })
}

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

  if (req.body.publisher && req.user.eduPersonScopedAffiliation >= config.PERMISSIONS.student) {
    publisher = JSON.parse(req.body.publisher)
    validatePublisherPromise = announcementsFunc.validatePublisher(publisher.publisherId)
  }

  (req.files != null) ? filesInput = req.files['uploads'] : filesInput = null
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
      announcementEntry.publisher.name = publisher.publisherName
      announcementEntry.publisher.id = publisher.publisherId
    }
    return announcementEntry.save()
  }).then(newAnnouncement => {
    return notificationsFunc.createNotification(newAnnouncement._id, publisher)
  }).then(newNotification => {
    return notificationsFunc.sendNotifications(announcementEntry, newNotification.id, publisher.id)
  }).then(newNotification => {
    // announcementsFunc.postToTeithe(announcementEntry, 'create')
    announcementsFunc.sendEmails(announcementEntry)
    req.app.io.emit('new announcement', newNotification)
    let log = new Log('insertNewAnnouncement', req.user.id, 'Η ανακοίνωση ανέβηκε επιτυχώς', getClientIp(req), 201)
    log.logAction('announcements')
    res.status(201).json({
      message: 'Η ανακοίνωση προστέθηκε επιτυχώς',
      announcementEntry
    })
  }).catch(function (promiseErr) {
    let applicationError = new ApplicationError('insertNewAnnouncement', req.user.id, promiseErr.code,
      promiseErr.error, 'Σφάλμα κατα την δημιουργία ανακοίνωσης.', getClientIp(req), promiseErr.httpCode)
    next(applicationError)
  })
}

function deleteAnnouncement (req, res, next) {
  let announcementId = req.params.id
  database.Announcements.findOne({_id: announcementId}).exec(function (err, announcement) {
    if (err || !announcement) {
      next(new ApplicationError('deleteAnnouncement', req.user.id, 1081, err, 'Συνέβη κάποιο σφάλμα κατα την διαγραφή ανακοίνωσης', getClientIp(req), 500))
    } else {
      if (announcement.publisher.id === req.user.id || req.user.eduPersonScopedAffiliation === config.PERMISSIONS.admin) {
        announcement.remove(function (err, announcementDeleted) {
          if (err) {
            next(new ApplicationError('deleteAnnouncement', req.user.id, 1082, err, 'Συνέβη κάποιο σφάλμα κατα την διαγραφή ανακοίνωσης', getClientIp(req), 500))
          } else {
            clientWordpress.deletePost(announcement.wordpressId, function () {})
            let log = new Log('deleteAnnouncement', req.user.id, 'Η ανακοίνωση διαγράφηκε επιτυχώς', getClientIp(req), 200)
            log.logAction('announcements')
            res.status(200).json({
              message: 'H ανακοίνωση διαγράφηκε επιτυχώς',
              announcementDeleted
            })
          }
        })
      } else {
        next(new ApplicationError('deleteAnnouncement', null, 1083, err, 'Δεν έχεις δικάιωμα για αυτήν την ενέργεια!', getClientIp(req), 401))
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
      throw new ApplicationError('editAnnouncement', req.user.id, 111, null, 'Δεν εχετε δικαίωμα επεξεργασίας.', getClientIp(req), 401)
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
    updatedAnnouncement.titleEn = req.body.titleEn || announcementToBeEdited.titleEn
    updatedAnnouncement.textEn = req.body.textEn || announcementToBeEdited.textEn
    updatedAnnouncement.wordpressId = announcementToBeEdited.wordpressId
    mongoose.Types.ObjectId.isValid(req.body.about) ? about = req.body.about : about = announcementToBeEdited._about
    return announcementsFunc.checkIfEntryExists(about, database.AnnouncementsCategories)
  }).then(category => {
    (category) ? updatedAnnouncement._about = mongoose.Types.ObjectId(category._id) : updatedAnnouncement._about = announcementToBeEdited._about
    database.Announcements.update({_id: req.params.id},
      updatedAnnouncement
    ).exec(function (err) {
      if (err) {
        next(new ApplicationError('editAnnouncement', req.user.id, 1091, null, 'Συνέβη κάποιο σφάλμα κατα την επεξεργασία ανακοίνωσης', getClientIp(req), 500))
      } else {
        database.AnnouncementsCategories.findOne({_id: announcementToBeEdited._about}, function (err, categoryOld) {
          if (err) {}
          if (category.public && categoryOld.public) {
            announcementsFunc.postToTeithe(updatedAnnouncement, 'edit')
          } else if (category.public) {
            announcementsFunc.postToTeithe(updatedAnnouncement, 'create')
          } else if (!category.public && categoryOld.public) {
            clientWordpress.deletePost(announcementToBeEdited.wordpressId, function () {})
          }
        })
        let log = new Log('editAnnouncement', req.user.id, 'Η ανακοίνωση ενημερώθηκε επιτυχώς', getClientIp(req), 201)
        log.logAction('announcements')
        res.status(201).json({
          message: 'Η ανακοίνωση αποθηκεύτηκε επιτυχώς'
        })
      }
    })
  }).catch(function (promiseErr) {
    let applicationError = new ApplicationError('editAnnouncement', req.user.id, promiseErr.code,
      promiseErr.error, 'Σφάλμα κατα την επεργασία ανακοίνωσης.', getClientIp(req), promiseErr.httpCode)
    next(applicationError)
  })
}

module.exports = {
  router: router
}
