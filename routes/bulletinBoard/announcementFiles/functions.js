const async = require('async')
const database = require('../../../configs/database')
const JSZip = require('jszip')
const ApplicationErrorClass = require('../../applicationErrorClass')
const mongoose = require('mongoose')

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

function browserMimeTypesSupported (type) {
  return (type === 'application/pdf' || type === 'image/gif' || type === 'image/jpeg' || type === 'image/png' || type === 'image/bmp')
}

function getFile (fileId, userLogged) {
  return new Promise((resolve, reject) => {
    if (mongoose.Types.ObjectId.isValid(fileId)) {
      database.File.findOne({_id: fileId}).populate('_announcement', '_about').populate({
        path: '_announcement',
        populate: {path: '_about', select: 'public'}
      }).exec(function (err, file) {
        if (err || !file) {
          reject(new ApplicationErrorClass('viewFile', null, 165, null, 'Συνέβη κάποιο σφάλμα κατα την προβολή αρχείου', null, 500))
        } else {
          if (file._announcement && file._announcement._about) {
            if ((file._announcement._about.public || userLogged)) {
              resolve(file)
            } else {
              reject(new ApplicationErrorClass(null, null, 160, null, 'Δεν έχετε δικαίωμα για αυτήν την ενέργεια', null, 500))
            }
          } else {
            reject(new ApplicationErrorClass(null, null, 161, null, 'Συνέβη κάποιο σφάλμα κατα την λήψη αρχείου', null, 500))
          }
        }
      })
    } else {
      reject(new ApplicationErrorClass(null, null, 168, null, 'Συνέβη κάποιο σφάλμα κατα την προβολή αρχείου', null, 500))
    }
  })
}

module.exports = {
  addToZip,
  browserMimeTypesSupported,
  getFile
}
