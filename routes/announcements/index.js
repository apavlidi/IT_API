const express = require('express')
const router = express.Router()
const database = require('./../../configs/database')
const functions = require('./../functions')
const announcementsFunctions = require('./functions')

const Joi = require('joi')
const validSchemas = require('./joi')

router.get('/', getAnnouncements)
router.get('/:id', getAnnouncement)
router.get('/feed/:type/:categoryIds?', validateInput('params', validSchemas.getAnnouncementFeedSchema), getAnnouncementsFeed)

const login = true

// let user = {}

function validateInput (objectToBeValidateStr, schema) {
  return function (req, res, next) {
    let objectToBeValidate = objectToBeValidateStr === 'params' ? req.params : req.body
    functions.sanitizeObject(objectToBeValidate)
    Joi.validate(objectToBeValidate, schema, function (err) {
      if (!err) {
        next()
      } else {
        res.status(500).json({message: 'Σφάλμα κατα την εισαγωγή δεδομένων'})
      }
    })
  }
}

function getAnnouncements (req, res) {
  functions.formatQuery(req.query).then(function (formatedQuery) {
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

  database.AnnouncementsCategories.find(filter).select('_id name').exec(function (err, rssCategories) {
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

module.exports = {
  router: router
}
