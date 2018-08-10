const database = require('../../../configs/database')
const async = require('async')
const ApplicationErrorClass = require('../../applicationErrorClass')

function updateRegistrationToCategories (categories, userId, action) {
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
          reject(new ApplicationErrorClass(null, null, 1222, err, null, null, 500))
        }
        resolve()
      })
    })
}

module.exports = {
  updateRegistrationToCategories
}