const database = require('../../../configs/database')
const async = require('async')
const PromiseError = require('../../promiseErrorClass')

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
              reject(new PromiseError(1221, err))
            }
            callback(null)
          })
        })
      })

      async.parallel(calls, function (err) {
        if (err) {
          reject(new PromiseError(1222, err))
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
        reject(new PromiseError(1242, err))
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
