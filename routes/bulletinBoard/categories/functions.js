const database = require('../../../configs/database')
const async = require('async')
const ApplicationErrorClass = require('../../applicationErrorClass')

function updateDatabaseRegistration (categories, userId, action) {
  return new Promise(
    function (resolve, reject) {
      let calls = []

      categories.forEach(function (id) {
        calls.push(function (callback) {
          let query;
          (action === '$addToSet') ? query = {'$addToSet': {'registered': userId}} : query = {'$pull': {'registered': userId}}
          database.AnnouncementsCategories.update({'_id': id}, query, function (err) {
            if (err) {
              reject(new ApplicationErrorClass(null, null, 1221, err, null, null, 500))
            }
            callback(null)
          })
        })
      })

      async.parallel(calls, function (err) {
        if (err) {
          reject(new ApplicationErrorClass('updateRegistrationToCategories', null, 1222, err, 'Σφάλμα κατά την ανανέωση εγγραφής', null, 500))
        }
        resolve()
      })
    })
}

function parseArraysInput (array) {
  return new Promise(
    function (resolve, reject) {
      try {
        let arrayParsed = JSON.parse(array)
        resolve(arrayParsed)
      } catch (err) {
        reject(new ApplicationErrorClass('updateRegistrationToCategories', null, 1242, err, 'Συνέβη σφάλμα κατα την εισαγωγή δεδομένων', null, 500))
      }
    })
}

function updateRegistrationToCategories (arrayOfCategories, userID, action) {
  return new Promise(
    function (resolve, reject) {
      parseArraysInput(arrayOfCategories).then(arrayParsed => {
        return updateDatabaseRegistration(arrayParsed, userID, action)
      }).then(() => {
        resolve()
      }).catch(function (applicationError) {
        reject(applicationError)
      })
    })
}

module.exports = {
  updateRegistrationToCategories
}
