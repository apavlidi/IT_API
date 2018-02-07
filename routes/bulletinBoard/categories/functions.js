const database = require('../../../configs/database')
const async = require('async')

function updateRegistrationToCategories (categories, userId, action) {
  return new Promise(
    function (resolve, reject) {
      let calls = []

      categories.forEach(function (id) {
        calls.push(function (callback) {
          database.AnnouncementsCategories.update({'_id': id}, {action: {'registered': userId}}, function (err) {
            if (err) {
              reject(err)
            }
            callback(null)
          })
        })
      })

      async.parallel(calls, function (err) {
        if (err) {
          reject(err)
        }
        resolve()
      })
    })
}

module.exports = {
  updateRegistrationToCategories
}