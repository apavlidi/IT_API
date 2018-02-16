const async = require('async')
const database = require('../../../configs/database')
const JSZip = require('jszip')


function addToZip (files) {
  return new Promise(
    function (resolve, reject) {
      let calls = []
      let zip = new JSZip()

      files.forEach(file => {
        calls.push(function (callback) {
          database.File.findOne({_id: file}).exec(function (err, file) {
            if (err) {
              reject(err)
            } else {
              zip.file(file.name, file.data)
              callback(null)
            }
          })
        })
      })

      async.parallel(calls, function (err) {
        if (err) {
          reject(err)
        }
        resolve(zip)
      })
    })
}

function browserMimeTypesSupported(type) {
  return (type === "application/pdf" || type === "image/gif" || type === "image/jpeg" || type === "image/png" || type === "image/bmp");
}

module.exports = {
  addToZip,
  browserMimeTypesSupported
}
