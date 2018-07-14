const express = require('express')
const router = express.Router()
const database = require('../../../configs/database')
const apiFunctions = require('../../apiFunctions')
const validSchemas = require('../joi')
const categoriesFunc = require('./functions')
const translate = require('./../../translate').elotTranslate
const auth = require('../../../configs/auth')
let ApplicationErrorClass = require('../../applicationErrorClass')
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
      next(new ApplicationErrorClass('getAnnouncementsCategories', req.user.id, 150, err, 'Συνέβη σφάλμα κατα την λήψη κατηγοριών', apiFunctions.getClientIp(req), 500))
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
      next(new ApplicationErrorClass('getAnnouncementsCategoriesPublic', null, 151, err, 'Συνέβη σφάλμα κατα την λήψη κατηγοριών', apiFunctions.getClientIp(req), 500))
    } else {
      res.status(200).json(categories)
    }
  })
}

function updateRegistrationToCategories (req, res, next) {
  let arrayRegistered = JSON.parse(req.body.categoriesRegistered)
  let arrayNotRegistered = JSON.parse(req.body.categoriesNotRegistered)
  categoriesFunc.updateRegistrationToCategories(arrayRegistered, req.user.id, '$addToSet').then(function () {
    return categoriesFunc.updateRegistrationToCategories(arrayNotRegistered, req.user.id, '$pull')
  }).then(function () {
    res.status(200).json({
      message: 'Η εγγραφή πραγματοποιήθηκε επιτυχώς',
    })
  }).catch(function (applicationError) {
    applicationError.type = 'registerCategories'
    applicationError.text = 'Σφάλμα την ανανέωση εγγραφής'
    applicationError.user = req.user.id
    applicationError.ip = apiFunctions.getClientIp(req)
    next(applicationError)
  })
}

function getIsRegisteredToCategories (req, res, next) {
  database.AnnouncementsCategories.find({}).select('id registered').sort(req.query.sort).skip(parseInt(req.query.page) * parseInt(req.query.limit)).limit(parseInt(req.query.limit)).exec(function (err, categories) {
    if (err) {
      next(new ApplicationErrorClass('getIsRegisteredCategories', null, 154, err, 'Συνέβη σφάλμα κατα την λήψη κατηγοριών', apiFunctions.getClientIp(req), 500))
    } else {
      categories.forEach(category => {
        category.registered.includes(req.user.id) ? category.registered = true : category.registered = false
      })
      res.status(200).json(categories)
    }
  })
}

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
          next(new ApplicationErrorClass('newCategory', req.user.id, 155, err, 'Συνέβη σφάλμα κατα την προσθήκη της κατηγορίας', apiFunctions.getClientIp(req), 500))
        } else {
          //logging
          // next(new ApplicationErrorClass('info', 'unknown', 'New', 'success', 'announcements', err, 'newCategory',
          //   'Η κατηγοριά προστέθηκε επιτυχώς με όνομα ' + category.name, req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress))
          res.status(201).json({message: 'Η κατηγορία προστέθηκε επιτυχώς'})
        }
      })
    } else {
      next(new ApplicationErrorClass('newCategory', req.user.id, 156, err, 'Ο τίτλος υπάρχει ήδη.', apiFunctions.getClientIp(req), 500))
    }
  })
}

function editCategory (req, res, next) {
  let editedCategory = req.body
  let categoryId = req.params.id
  if (editedCategory.publicCategory === 'true') {
    if (editedCategory.wid != 5 && editedCategory.wid != 31) {
      editedCategory.wid = 5
    }
  } else {
    editedCategory.wid = null
  }
  let editedValue = editedCategory.name.replace(/ /g, '')
  database.AnnouncementsCategories.findOneAndUpdate({_id: categoryId}, {
    $set: {
      name: editedCategory.name,
      value: editedValue,
      wid: editedCategory.wid,
      public: editedCategory.publicCategory
    }
  }, function (err, categoryUpdated) {
    if (err) {
      next(new ApplicationErrorClass('editCategory', req.user.id, 156, err, 'Σφάλμα κατα την ενημέρωση της κατηγορίας.', apiFunctions.getClientIp(req), 500))
    } else {
      //logging
      // next(new ApplicationErrorClass('info', 'unknown', 'EDIT', 'fail', 'announcements', err, 'editCategory',
      //   'Η κατηγορία ενημερώθηκε επιτυχώς με id: ' + categoryId, req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress))
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
      next(new ApplicationErrorClass('deleteCategory', req.user.id, 157, err, 'Δεν βρέθηκε η κατηγορία ανακοινώσεων για να διαγραφεί', apiFunctions.getClientIp(req), 500))
    } else {
      category.remove(function (err, categoryDeleted) {
        if (err) {
          next(new ApplicationErrorClass('deleteCategory', req.user.id, 158, err, 'Συνέβει κάποιο σφάλμα κατα την διαγραφή της κατηγορίας', apiFunctions.getClientIp(req), 500))
        } else {
          //logging
          // next(new ApplicationErrorClass('info', 'unknown', 'DELETE', 'success', 'announcements', err, 'deleteCategory',
          //   'Η κατηγορία διαγράφτηκε επιτυχώς με id: ' + category._id, req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress))
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
