const express = require('express')
const router = express.Router()
const database = require('../../../configs/database')
const apiFunctions = require('../../apiFunctions')
const getClientIp = require('../../apiFunctions').getClientIp
const validSchemas = require('../joi')
const categoriesFunc = require('./functions')
const translate = require('./../../translate').elotTranslate
const auth = require('../../../configs/auth')
let ApplicationError = require('../../applicationErrorClass')
let Log = require('../../logClass')
const config = require('../../../configs/config')

router.get('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.formatQuery, getAnnouncementsCategories)
router.get('/public', apiFunctions.formatQuery, getAnnouncementsCategoriesPublic)
router.put('/register', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.validateInput('body', validSchemas.registerCategoriesSchema), updateRegistrationToCategories)
router.get('/isRegistered', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student), apiFunctions.formatQuery, getIsRegisteredToCategories)

router.post('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.professor), apiFunctions.validateInput('body', validSchemas.newCategorySchema), newCategory)
router.put('/:id', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.professor), apiFunctions.validateInput('body', validSchemas.editCategorySchemaBody), editCategory)
router.delete('/:id', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.professor), deleteCategory)

function getAnnouncementsCategories (req, res, next) {
  if (!req.query.fields) {
    req.query.fields = '-registered'
  }
  database.AnnouncementsCategories.find(req.query.filters).select(req.query.fields).sort(req.query.sort).skip(parseInt(req.query.page) * parseInt(req.query.limit)).limit(parseInt(req.query.limit)).exec(function (err, categories) {
    if (err) {
      next(new ApplicationError('getAnnouncementsCategories', req.user.id, 1201, err, 'Συνέβη σφάλμα κατα την λήψη κατηγοριών', getClientIp(req), 500, false))
    } else {
      res.status(200).json(categories)
    }
  })
}

function getAnnouncementsCategoriesPublic (req, res, next) {
  if (!req.query.fields) {
    req.query.fields = '-registered'
  }
  database.AnnouncementsCategories.find({public: true}).select(req.query.fields).sort(req.query.sort).skip(parseInt(req.query.page) * parseInt(req.query.limit)).limit(parseInt(req.query.limit)).exec(function (err, categories) {
    if (err) {
      next(new ApplicationError('getAnnouncementsCategoriesPublic', null, 1211, err, 'Συνέβη σφάλμα κατα την λήψη κατηγοριών', getClientIp(req), 500, false))
    } else {
      res.status(200).json(categories)
    }
  })
}

function updateRegistrationToCategories (req, res, next) {
  let addCat = req.body.addCat
  let removeCat = req.body.removeCat
  let promiseAdd
  let promiseRemove
  if (addCat) {
    promiseAdd = categoriesFunc.updateRegistrationToCategories(addCat, req.user.id, '$addToSet')
  }
  if (removeCat) {
    promiseRemove = categoriesFunc.updateRegistrationToCategories(removeCat, req.user.id, '$pull')
  }
  Promise.all([promiseAdd, promiseRemove]).then(() => {
    let log = new Log('updateRegistrationToCategories', req.user.id, 'Η εγγραφή πραγματοποιήθηκε επιτυχώς', getClientIp(req), 200)
    log.logAction('announcements')
    res.status(200).json({
      message: 'Η εγγραφή πραγματοποιήθηκε επιτυχώς'
    })
  }).catch(function (promiseErr) {
    let applicationError = new ApplicationError('updateRegistrationToCategories', req.user.id, promiseErr.code,
      promiseErr.error, 'Σφάλμα κατα την ενημέρωση.', getClientIp(req), promiseErr.httpCode)
    next(applicationError)
  })
}

function getIsRegisteredToCategories (req, res, next) {
  database.AnnouncementsCategories.find({}).select('id registered').sort(req.query.sort).skip(parseInt(req.query.page) * parseInt(req.query.limit)).limit(parseInt(req.query.limit)).exec(function (err, categories) {
    if (err) {
      next(new ApplicationError('getIsRegisteredCategories', req.user.id, 1231, err, 'Συνέβη σφάλμα κατα την λήψη κατηγοριών', getClientIp(req), 500, false))
    } else {
      categories.forEach(category => {
        category.registered.includes(req.user.id) ? category.registered = true : category.registered = false
      })
      res.status(200).json(categories)
    }
  })
}

// TODO FORMAT
function newCategory (req, res, next) {
  database.AnnouncementsCategories.findOne({name: req.body.categoryTitle}, function (err, categoryExists) {
    if (!categoryExists) {
      let category = new database.AnnouncementsCategories()
      if (req.body.wid !== 5 && req.body.wid !== 31) {
        req.body.wid = 5
      }
      category.name = req.body.categoryTitle
      category.public = req.body.publicCategory
      category.wid = req.body.wid
      let translatedValue = ''
      try {
        try {
          translatedValue = translate(category.name.toLowerCase()).toUpperCase()
        } catch (err) {
          translatedValue = translate(category.name)
        }
      } catch (err) {
        translatedValue = category.name
      }
      category.value = translatedValue.toLowerCase().replace(/\s/g, '')
      category.save((err) => {
        if (err) {
          next(new ApplicationError('newCategory', req.user.id, 1241, err, 'Συνέβη σφάλμα κατα την προσθήκη της κατηγορίας', getClientIp(req), 500))
        } else {
          let log = new Log('newCategory', req.user.id, 'Η κατηγορία προστέθηκε επιτυχώς', getClientIp(req), 201)
          log.logAction('announcements')
          res.status(201).json({message: 'Η κατηγορία προστέθηκε επιτυχώς'})
        }
      })
    } else {
      next(new ApplicationError('newCategory', req.user.id, 1242, err, 'Ο τίτλος υπάρχει ήδη.', getClientIp(req), 500))
    }
  })
}

function editCategory (req, res, next) {
  let categoryId = req.params.id
  let editedCategory = {
    name: req.body.name,
    public: req.body.publicCategory,
    value: req.body.name.replace(/ /g, '')
  }
  if (editedCategory.public === 'true') {
    if (editedCategory.wid !== 5 && editedCategory.wid !== 31) {
      editedCategory.wid = 5
    } else {
      editedCategory.wid = req.body.wid
    }
  }
  database.AnnouncementsCategories.findOneAndUpdate({_id: categoryId}, {
    $set: editedCategory
  }, function (err, categoryUpdated) {
    if (err) {
      next(new ApplicationError('editCategory', req.user.id, 1251, err, 'Σφάλμα κατα την ενημέρωση της κατηγορίας.', getClientIp(req), 500))
    } else {
      let log = new Log('editCategory', req.user.id, 'Η κατηγορία ενημερώθηκε επιτυχώς', getClientIp(req), 201)
      log.logAction('announcements')
      res.status(201).json({
        message: 'Η κατηγορία ενημερώθηκε επιτυχώς',
        categoryUpdated
      })
    }
  })
}

function deleteCategory (req, res, next) {
  let category = req.params.id
  database.AnnouncementsCategories.findOne({_id: category}, function (err, category) {
    if (!category || err) {
      next(new ApplicationError('deleteCategory', req.user.id, 1261, err, 'Δεν βρέθηκε η κατηγορία ανακοινώσεων για να διαγραφεί', getClientIp(req), 500))
    } else {
      category.remove(function (err, categoryDeleted) {
        if (err) {
          next(new ApplicationError('deleteCategory', req.user.id, 1262, err, 'Συνέβει κάποιο σφάλμα κατα την διαγραφή της κατηγορίας', getClientIp(req), 500))
        } else {
          let log = new Log('deleteCategory', req.user.id, 'Η κατηγορία διαγράφτηκε επιτυχώς', getClientIp(req), 200)
          log.logAction('announcements')
          res.status(200).json({
            message: 'Η κατηγορία διαγράφτηκε επιτυχώς',
            categoryDeleted
          })
        }
      })
    }
  })
}

module.exports = {
  router: router
}
