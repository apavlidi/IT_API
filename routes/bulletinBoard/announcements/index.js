const express = require('express')
const router = express.Router()
const database = require('../../../configs/database')
const apiFunctions = require('../../apiFunctions')
const announcementsFunc = require('./functions')
const mongoose = require('mongoose')
const wordpress = require('wordpress')
const auth = require('../../../configs/auth')
const config = require('../../../configs/config')

const validSchemas = require('../joi')
const WORDPRESS_CREDENTIALS = require('./../../../configs/config').WORDPRESS_CREDENTIALS
const clientWordpress = wordpress.createClient(WORDPRESS_CREDENTIALS)
const ApplicationErrorClass = require('../../applicationErrorClass')
const log = require('./../../../configs/logs').general

router.get('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), getAnnouncements)
router.get('/public', getAnnouncementsPublic)
router.get('/:id', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student, true), apiFunctions.validateInput('params', validSchemas.getAnnouncementSchema), getAnnouncement)
router.get('/feed/:type/:categoryIds?', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student, true), apiFunctions.validateInput('params', validSchemas.getAnnouncementFeedSchema), getAnnouncementsFeed)
router.post('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.validateInput('body', validSchemas.newAnnouncementsQuerySchema), insertNewAnnouncement)
router.put('/:id', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.validateInput('body', validSchemas.editAnnouncementsQuerySchema), editAnnouncement)
router.delete('/:id', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.validateInput('params', validSchemas.deleteAnnouncementSchema), deleteAnnouncement)

function getAnnouncements (req, res, next) {
  apiFunctions.formatQuery(req.query).then(function (formatedQuery) {
    database.Announcements.find(formatedQuery.filters).select(formatedQuery.fields).populate('_about',
      'name public').populate('attachments', 'name').sort(formatedQuery.sort).exec(function (err, announcements) {
      if (!err) {
        next(new ApplicationErrorClass('getAnnouncements', req.user.id, 100, err, 'Συνεβη καποιο λάθος κατα την λήψη ανακοινώσεων.', apiFunctions.getClientIp(req), 500))
      } else {
        res.status(200).json(announcements)
      }
    })
  })
}

// TODO Replace login check
function getAnnouncement (req, res, next) {
  let announcementsId = req.params.id
  database.Announcements.findOne({_id: announcementsId}).populate('_about', 'name public').populate('attachments',
    'name').exec(function (err, announcement) {
    if (err) {
      next(new Error('Συνεβη καποιο λάθος κατα την λήψη ανακοίνωσης.'))
    } else {
      announcementsFunc.checkIfEntryExists(announcement._about, database.AnnouncementsCategories).then(() => {
        if (req.user || announcement._about.public) {
          res.status(200).json(announcement)
        } else {
          res.status(401).json({message: 'Δεν έχεις δικάιωμα για αυτήν την ενέργεια!'})
        }
      }).catch(next)
    }
  })
}

// by default it returns all public announcements,if id is passed it returns the announcements of the category
// TODO Replace login check
function getAnnouncementsFeed (req, res, next) {
  let filter
  let feedType = req.params.type
  let login = req.user != null

  if (req.params.categoryIds) {
    let categoryIds = req.params.categoryIds.split(',')
    filter = login ? {_id: {$in: categoryIds}} : {value: {$in: categoryIds}, public: true}
  } else {
    filter = login ? {public: true} : {}
  }

  database.AnnouncementsCategories.find(filter).select('_id name').sort([['date', 'descending']]).exec(function (err, rssCategories) {
    if (err || !rssCategories.length) {
      next(new Error('Συνεβη καποιο λάθος κατα την λήψη ανακοινώσεων.'))
    } else {
      database.Announcements.find({_about: {$in: rssCategories}}).populate('_about', 'name').populate('attachments',
        'name').exec(function (err, announcements) {
        if (err) {
          next(new Error('Συνεβη καποιο λάθος κατα την λήψη ανακοινώσεων.'))
        } else {
          announcementsFunc.getAnnouncementsRSSPromise(announcements, rssCategories, req.params.categoryIds,
            feedType, res, login).then(function (response) {
            res.send(response)
          }).catch(function () {
            next(new Error('Σφάλμα κατα την δημιουργεία RSS'))
          })
        }
      })
    }
  })
}

function getAnnouncementsPublic (req, res, next) {
  database.AnnouncementsCategories.find({public: true}).select('_id').exec(function (err, publicCategories) {
    if (err) {
      next(new ApplicationErrorClass('Συνεβη καποιο λάθος κατα την λήψη ανακοινώσεων'))
    } else {
      database.Announcements.find({_about: {$in: publicCategories}}).populate('_about', 'name').populate('attachments', 'name').exec(function (err, announcements) {
        if (err) {
          next(new Error('Συνεβη καποιο λάθος κατα την λήψη ανακοινώσεων'))
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
  let announcementEntry = new database.Announcements()
  let announcementId = mongoose.Types.ObjectId()
  let publisher = {nameEn: req.user.displayName, id: req.user.id, nameEl: req.user.displayNameEl}
  announcementEntry._id = announcementId
  announcementEntry.title = req.body.title
  announcementEntry.text = req.body.text
  announcementEntry.textEn = req.body.textEn || req.body.text
  announcementEntry.titleEn = req.body.titleEn || req.body.title
  announcementEntry.publisher.name = publisher.nameEn
  announcementEntry.publisher.id = publisher.id

  let validatePublisherPromise = Promise.resolve(false) // initialize a promise as false
  if (req.body.publisher && req.user.scope >= config.PERMISSIONS.futureUseSix) { // TODO && req.session.user.scope >= PERMISSIONS.futureUseSix
    validatePublisherPromise = announcementsFunc.validatePublisher(req.body.publisher.publisherId) // if he sent a publisher we have to check it with a request to the ldap api
  }

  req.files != null ? filesInput = req.files['uploads[]'] : null
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
        nameEn: req.body.publisher.publisherName,
        id: req.body.publisher.publisherId,
        nameEl: req.body.publisher.publisherName
      }
      announcementEntry.publisher.name = publisher.nameEn
      announcementEntry.publisher.id = publisher.id
    }
    announcementEntry.save(function (err, newAnnouncement) {
      // announcementsFunc.postToTeithe(announcementEntry)
      // announcementsFunc.sendEmails(announcementEntry)

      announcementsFunc.createNotification(newAnnouncement._id, publisher).then(newNotification => {
        announcementsFunc.sendNotifications(announcementEntry, newNotification.id, publisher.id).then(function () {
          req.app.io.emit('new announcement', newNotification)
        })
      })

      // apiFunctions.logging(new ApplicationErrorClass('info', 'unknown', 'NEW', 'success', 'announcements', 'insertNewAnnouncement',
      //   'Η ανακοίνωση προστέθηκε επιτυχώς με id: ' + newAnnouncement._id,
      //   req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress))

      res.status(201).json({
        message: 'Η ανακοίνωση προστέθηκε επιτυχώς',
        newAnnouncement
      })
    })
  })
    .catch(function (err) {
      next(new ApplicationErrorClass('Σφάλμα κατα την δημιουργία ανακοίνωσης.'))
    })
}

function deleteAnnouncement (req, res, next) {
  apiFunctions.sanitizeObject(req.params)
  let announcementId = req.params.id
  database.Announcements.findOne({_id: announcementId}).exec(function (err, announcement) {
    if (err || !announcement) {
      next(new ApplicationErrorClass('error', 'unknown', 'DELETE', 'fail', 'announcements', err, 'deleteAnnouncement',
        'Σφάλμα κατα την ευρεση ανακοίνωσης με id: ' + announcementId, 'Σφάλμα κατα την διαγραφή ανακοίνωσης'))
    } else {
      //TODO check (announcement.publisher.id === req.session.user.id || req.session.user.scope === PERMISSIONS.admin)
      if (announcement.publisher.id === req.user.id || req.user.eduPersonScopedAffiliation === config.PERMISSIONS.admin) {
        announcement.remove(function (err, announcementDeleted) {
          if (err) {
            next(new ApplicationErrorClass('error', 'unknown', 'DELETE', 'fail', 'announcements', err, 'deleteAnnouncement',
              'Σφάλμα κατα την διαγραφή ανακοίνωσης με id: ' + announcementId))
          } else {
            next(new ApplicationErrorClass('info', 'unknown', 'DELETE', 'success', 'announcements', err, 'deleteAnnouncement',
              'H ανακοίνωση διαγράφηκε επιτυχώς με id: ' + announcementId, req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress))
            clientWordpress.deletePost(announcement.wordpressId, function (error, data) {})
            res.status(200).json({
              message: 'H ανακοίνωση διαγράφηκε επιτυχώς',
              announcementDeleted
            })
          }
        })
      } else {
        // let logEntry = logging(req.session.user.id, 'DELETE', 'fail', 'announcements', {
        //   track: 'deleteAnnouncement',
        //   text: 'Μη εξουσιοδοτημένος χρήστης'
        // }, req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress)
        // log.error(logEntry)
        res.status(401).json({message: 'Δεν έχεις δικάιωμα για αυτήν την ενέργεια!'})
      }
    }
  })
}

function editAnnouncement (req, res, next) {
  apiFunctions.sanitizeObject(req.body)
  apiFunctions.sanitizeObject(req.params)
  let files
  let about
  let announcementToBeEdited
  let updatedAnnouncement = {}
  let requestedFiles

  //TODO Check id of req.files from from-end
  (req.files && req.files['uploads[]2']) ? requestedFiles = req.files['uploads[]2'] : requestedFiles = null
  announcementsFunc.gatherFilesInput(requestedFiles).then(filesReturned => {
    files = filesReturned
    return announcementsFunc.checkIfEntryExists(req.params.id, database.Announcements)
  }).then(announcement => {
    announcementToBeEdited = announcement
    if (!(announcement.publisher.id === req.user.id || req.user.eduPersonScopedAffiliation === config.PERMISSIONS.admin)) {
      throw new ApplicationErrorClass('error', 'unknown', 'EDIT', 'fail', 'announcements', 'not authorized', 'editAnnouncement',
        'Δεν εχετε δικαίωμα επεξεργασίας: ' + announcementToBeEdited._id, 'Σφάλμα επεξεργασίας')
    }
    announcementsFunc.createFileEntries(files, announcementToBeEdited._id)
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
    req.body.titleEn ? updatedAnnouncement.titleEn = req.body.titleEn : updatedAnnouncement.titleEn = announcementToBeEdited.titleEn
    req.body.textEn ? updatedAnnouncement.textEn = req.body.textEn : updatedAnnouncement.textEn = announcementToBeEdited.textEn
    mongoose.Types.ObjectId.isValid(req.body.about) ? about = req.body.about : about = announcementToBeEdited._about
    return announcementsFunc.checkIfEntryExists(about, database.AnnouncementsCategories)
  }).then(category => {
    (category) ? updatedAnnouncement._about = mongoose.Types.ObjectId(category._id) : updatedAnnouncement._about = announcementToBeEdited._about
    database.Announcements.update({_id: req.params.id},
      updatedAnnouncement
    ).exec(function (err) {
      database.AnnouncementsCategories.findOne({_id: announcementToBeEdited._about}, function (err, categoryOld) {
        if (category.public && categoryOld.public) {
          //       announcementsFunc.postToTeithe(updatedAnnouncement, 'edit')
        } else if (category.public) {
          //    announcementsFunc.postToTeithe(updatedAnnouncement, 'create')
        } else if (!category.public && categoryOld.public) {
          //      clientWordpress.deletePost(announcementToBeEdited.wordpressId, function (error, data) {
          //      })
        }
      })
      res.status(201).json({
        message: 'Η ανακοίνωση αποθηκεύτηκε επιτυχώς'
      })
    })
  }).catch(next)
}

module.exports = {
  router: router
}
