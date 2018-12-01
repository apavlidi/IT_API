const express = require('express')
const router = express.Router()
const database = require('../../../configs/database')
const getClientIp = require('../../apiFunctions').getClientIp
const mongoose = require('mongoose')
const fs = require('fs')
const filesFunc = require('./functions')
const fileType = require('file-type')
const ApplicationError = require('../../applicationErrorClass')
const Log = require('../../logClass')
const auth = require('../../../configs/auth')
const config = require('../../../configs/config')

router.get('/:id', auth.checkAuth(['announcements'], config.PERMISSIONS.student, true), getFile)
router.get('/download/:id', auth.checkAuth(['announcements'], config.PERMISSIONS.student, true), downloadFile)
router.get('/:announcementId/downloadAll', auth.checkAuth(['announcements'], config.PERMISSIONS.student, true), downloadFiles)
router.get('/:id/view', auth.checkAuth(['announcements'], config.PERMISSIONS.student, true), viewFile)
router.delete('/:id', auth.checkAuth(['edit_announcements'], config.PERMISSIONS.professor), deleteFile)

function getFile (req, res, next) {
    filesFunc.getFile(req.params.id, req.user).then(file => {
        let name = encodeURIComponent(file.name)
        res.writeHead(200, {
        'Content-Length': Buffer.byteLength(file.data),
        'Content-Type': file.contentType,
        'Content-Disposition': 'attachment;filename*=UTF-8\'\'' + name
    })
    res.end(file.data) // the second parameter is cashed to the browser
}).catch(function (promiseErr) {
        let applicationError = new ApplicationError('getFile', null, promiseErr.code,
            promiseErr.error, 'Σφάλμα κατά την εμφάνιση αρχείου.', getClientIp(req), promiseErr.httpCode, false)
        next(applicationError)
    })
}

function downloadFile (req, res, next) {
  filesFunc.getFile(req.params.id, req.user).then(file => {
      res.status(200).json(file)
}).catch(function (promiseErr) {
    let applicationError = new ApplicationError('downloadFile', null, promiseErr.code,
      promiseErr.error, 'Σφάλμα κατά την λήψη αρχείου.', getClientIp(req), promiseErr.httpCode, false)
    next(applicationError)
  })
}

function downloadFiles (req, res, next) {
  if (mongoose.Types.ObjectId.isValid(req.params.announcementId)) {
    let announcementId = req.params.announcementId
    database.Announcements.findOne({_id: announcementId}).populate('_about', 'public').exec(function (err, announcement) {
      if (announcement && !err) {
        if (announcement._about.public || req.user) {
          let files = announcement.attachments
          filesFunc.addToZip(files).then(function (finalZip) {
            finalZip
              .generateNodeStream({type: 'nodebuffer', streamFiles: true})
              .pipe(fs.createWriteStream('files.zip'))
              .on('finish', function () {
                finalZip.generateAsync({type: 'uint8array'})
                  .then(function (content) {
                    res.status(200).download('files.zip', function (err) {
                      if (!err) {
                        fs.unlink('files.zip')
                      }
                    })
                  })
              })
          }).catch(function (promiseErr) {
            let applicationError = new ApplicationError('downloadFiles', null, promiseErr.code,
              promiseErr.error, 'Σφάλμα κατά την λήψη αρχείων.', getClientIp(req), promiseErr.httpCode, false)
            next(applicationError)
          })
        } else {
          next(new ApplicationError('downloadFiles', null, 1112, null, 'Δεν έχετε δικαίωμα για αυτήν την ενέργεια', getClientIp(req), 500, false))
        }
      } else {
        next(new ApplicationError('downloadFiles', null, 1116, err, 'Σφάλμα κατά την εύρεση αρχείου', getClientIp(req), 500, false))
      }
    })
  } else {
    next(new ApplicationError('downloadFiles', null, 1113, null, 'Συνέβη κάποιο σφάλμα κατα την λήψη αρχείων', getClientIp(req), 500, false))
  }
}

function viewFile (req, res, next) {
  filesFunc.getFile(req.params.id, req.user).then(file => {
    let type = fileType(file.data)
    if (type != null && filesFunc.browserMimeTypesSupported(type.mime)) { // here we can check what types we want to send depending if the browser supports it (eg pdf is supported)
      res.contentType(type.mime)
      res.send(file.data)
    } else {
      let name = encodeURIComponent(file.name)
      res.writeHead(200, {
        'Content-Type': file.contentType,
        'Content-Disposition': 'attachment;filename*=UTF-8\'\'' + name
      })
      res.end(file.data)
    }
  }).catch(function (promiseErr) {
    let applicationError = new ApplicationError('downloadFile', null, promiseErr.code,
      promiseErr.error, 'Σφάλμα κατά την προβολή αρχείου.', getClientIp(req), promiseErr.httpCode, false)
    next(applicationError)
  })
}

function deleteFile (req, res, next) {
  let fileId = req.params.id
  database.Announcements.findOne({'attachments': fileId}, function (err, announcement) {
    if (err || !announcement) {
      next(new ApplicationError('deleteFile', req.user.id, 1121, null, 'Σφάλμα κατα την εύρεση αρχείου', getClientIp(req), 500))
    } else {
      if (announcement.publisher.id === req.user.id || req.user.scope === config.PERMISSIONS.admin) {
        announcement.attachments.pull(fileId)
        announcement.save(function (err) {
          if (err) {
            next(new ApplicationError('deleteFile', req.user.id, 1122, err, 'Σφάλμα κατα την διαγραφή αρχείου', getClientIp(req), 500))
          } else {
            database.File.findOneAndRemove({_id: fileId}, function (err) {
              if (err) {
                next(new ApplicationError('deleteFile', req.user.id, 1123, err, 'Σφάλμα κατα την διαγραφή αρχείου', getClientIp(req), 500))
              } else {
                let log = new Log('deleteFile', req.user.id, 'Το αρχείο διαγράφηκε επιτυχώς', getClientIp(req), 200)
                log.logAction('announcements')
                res.status(200).json({
                  message: 'Το αρχείο διαγράφηκε επιτυχώς'
                })
              }
            })
          }
        })
      } else {
        next(new ApplicationError('deleteFile', req.user.id, 1124, err, 'Δεν έχετε δικαίωμα για αυτήν την ενέργεια', getClientIp(req), 500))
      }
    }
  })
}

module.exports = {
  router: router
}
