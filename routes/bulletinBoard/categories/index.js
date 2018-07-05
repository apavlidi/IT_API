const express = require('express')
const router = express.Router()
const database = require('../../../configs/database')
const apiFunctions = require('../../apiFunctions')
const validSchemas = require('../joi')
const categoriesFunc = require('./functions')
const translate = require('./../../translate').elotTranslate
let ApplicationErrorClass = require('../../applicationErrorClass')

router.get('/', getAnnouncementsCategories)
router.get('/public', getAnnouncementsCategoriesPublic)
router.put('/register', apiFunctions.validateInput('body', validSchemas.registerCategoriesSchema), registerCategories)
router.get('/isRegistered', getIsRegisteredCategories)

router.post('/', apiFunctions.validateInput('body', validSchemas.newCategorySchema), newCategory)
router.put('/:id', apiFunctions.validateInput('body', validSchemas.editCategorySchemaBody), apiFunctions.validateInput('params', validSchemas.editCategorySchemaParams), editCategory)
router.delete('/:id', apiFunctions.validateInput('params', validSchemas.deleteCategorySchema), deleteCategory)

//TODO Check if field 'registered' has to be returned
function getAnnouncementsCategories (req, res, next) {
  apiFunctions.formatQuery(req.query).then(function (formatedQuery) {
    if (!formatedQuery.fields) {
      formatedQuery.fields = '-registered'
    }
    database.AnnouncementsCategories.find(formatedQuery.filters).select(formatedQuery.fields).sort(formatedQuery.sort).exec(function (err, categories) {
      if (err) {
        res.status(500).json({message: 'Συνέβη σφάλμα κατα την λήψη κατηγοριών'})
      } else {
        res.status(200).json(categories)
      }
    })
  }).catch(function (err) {
    res.status(500).json({message: 'error'})
  })
}

function getAnnouncementsCategoriesPublic (req, res, next) {
  apiFunctions.sanitizeObject(req.query)
  apiFunctions.formatQuery(req.query).then(function (formatedQuery) {
    if (!formatedQuery.fields) {
      //TODO CHECK ABOUT THIS.SECURITY ISSUE
      formatedQuery.fields = '-registered'
    }
    database.AnnouncementsCategories.find({public: true}).select(formatedQuery.fields).sort(formatedQuery.sort).exec(function (err, categories) {
      if (err) {
        next(new Error('Συνέβη σφάλμα κατα την λήψη κατηγοριών'))
      } else {
        res.status(200).json(categories)
      }
    })
  }).catch(function (err) {
    next(new Error('Συνέβη σφάλμα κατα την λήψη κατηγοριών'))
  })
}

function registerCategories (req, res, next) {
  apiFunctions.sanitizeObject(req.body)
  let arrayRegistered = JSON.parse(req.body.categoriesRegistered)
  let arrayNotRegistered = JSON.parse(req.body.categoriesNotRegistered)
  categoriesFunc.updateRegistrationToCategories(arrayRegistered, req.session.user.id, '$addToSet').then(function () {
    categoriesFunc.updateRegistrationToCategories(arrayNotRegistered, req.session.user.id, '$pull').then(function () {
      res.status(200).json({
        message: 'Η εγγραφή πραγματοποιήθηκε επιτυχώς',
      }).catch(function (err) {
        next(new Error('Σφάλμα κατα την ακύρωση εγγραφής'))
      })
    })
  }).catch(function (err) {
    next(new Error('Σφάλμα κατα την εγγραφή'))
  })
}

//TODO Change req.session.user.id
function getIsRegisteredCategories (req, res, next) {
  apiFunctions.sanitizeObject(req.query)
  database.AnnouncementsCategories.find({}).select('name id registered').sort('_id').exec(function (err, categories) {
    if (err) {
      next(new Error('Συνέβη σφάλμα κατα την λήψη κατηγοριών'))
    } else {
      categories.forEach(category => {
        category.registered.includes(req.session.user.id) ? category.registered = true : category.registered = false
      })
      res.status(200).json(categories)
    }
  })
}

function newCategory (req, res, next) {
  apiFunctions.sanitizeObject(req.body)
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
          next(new ApplicationErrorClass('error', 'unknown', 'New', 'fail', 'announcements', err, 'newCategory',
            'Συνέβη σφάλμα κατα την προσθήκη της κατηγορίας', req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress))
        } else {
          next(new ApplicationErrorClass('info', 'unknown', 'New', 'success', 'announcements', err, 'newCategory',
            'Η κατηγοριά προστέθηκε επιτυχώς με όνομα ' + category.name, req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress))

          res.status(201).json({message: 'Η κατηγορία προστέθηκε επιτυχώς'})
        }
      })
    } else {
      next(new ApplicationErrorClass('error', 'unknown', 'New', 'fail', 'announcements', err, 'newCategory',
        'Ο τίτλος υπάρχει ήδη :' + req.body.categoryTitle, req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress))
    }
  })
}

function editCategory (req, res, next) {
  apiFunctions.sanitizeObject(req.params)
  apiFunctions.sanitizeObject(req.body)
  let editedCategory = req.body
  let categoryId = req.params.id
  if (editedCategory.publicCategory === 'true') {
    if (editedCategory.wid !== 5 && editedCategory.wid !== 31) {
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
      next(new ApplicationErrorClass('error', 'unknown', 'EDIT', 'fail', 'announcements', err, 'editCategory',
        'Σφάλμα κατα την ενημέρωση της κατηγορίας με id: ' + categoryId, req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress))
    } else {
      next(new ApplicationErrorClass('info', 'unknown', 'EDIT', 'fail', 'announcements', err, 'editCategory',
        'Η κατηγορία ενημερώθηκε επιτυχώς με id: ' + categoryId, req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress))
      res.status(201).json({
        message: 'Η κατηγορία ενημερώθηκε επιτυχώς',
        categoryUpdated
      })
    }
  })
}

function deleteCategory (req, res, next) {
  apiFunctions.sanitizeObject(req.params)
  let category = req.params.id
  database.AnnouncementsCategories.findOne({_id: category}, function (err, category) {
    if (!category || err) {
      next(new ApplicationErrorClass('error', 'unknown', 'DELETE', 'fail', 'announcements', err, 'deleteCategory',
        'Δεν βρέθηκε η κατηγορία ανακοινώσεων για να διαγραφεί με id: ' + category, req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress))
    } else {
      category.remove(function (err, categoryDeleted) {
        if (err) {
          next(new ApplicationErrorClass('error', 'unknown', 'DELETE', 'fail', 'announcements', err, 'deleteCategory',
            'Συνέβει κάποιο σφάλμα κατα την διαγραφή της κατηγορίας με id: ' + category._id, req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress))
        } else {
          next(new ApplicationErrorClass('info', 'unknown', 'DELETE', 'success', 'announcements', err, 'deleteCategory',
            'Η κατηγορία διαγράφτηκε επιτυχώς με id: ' + category._id, req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress))
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
