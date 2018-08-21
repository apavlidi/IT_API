const async = require('async')
const database = require('../../../configs/database')
const JSZip = require('jszip')
const mongoose = require('mongoose')
const PromiseError = require('../../promiseErrorClass')

function addToZip (files) {
  return new Promise(
    function (resolve, reject) {
      let calls = []
      let zip = new JSZip()

      files.forEach(file => {
        calls.push(function (callback) {
          database.File.findOne({_id: file}).exec(function (err, file) {
            if (err || !file) {
              reject(new PromiseError(1114, err))
            } else {
              zip.file(file.name, file.data)
              callback(null)
            }
          })
        })
      })

      async.parallel(calls, function (err) {
        if (err) {
          reject(new PromiseError(1115, err))
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
          reject(new PromiseError(1101, err))
        } else {
          if (file._announcement && file._announcement._about) {
            if ((file._announcement._about.public || userLogged)) {
              resolve(file)
            } else {
              reject(new PromiseError(1102, null))
            }
          } else {
            reject(new PromiseError(1103, null))
          }
        }
      })
    } else {
      reject(new PromiseError(1104, null))
    }
  })
}

module.exports = {
  addToZip,
  browserMimeTypesSupported,
  getFile
}
