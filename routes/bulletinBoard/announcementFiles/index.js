const express = require('express')
const router = express.Router()
const database = require('../../../configs/database')
const apiFunctions = require('../../apiFunctions')
const mongoose = require('mongoose')
const fs = require('fs')
const filesFunc = require('./functions')
const fileType = require('file-type')
const ApplicationErrorClass = require('../../applicationErrorClass')
const auth = require('../../../configs/auth')
const config = require('../../../configs/config')

router.get('/:id', auth.checkAuth(['announcements'], config.PERMISSIONS.student, true), downloadFile)
router.get('/:announcementId/downloadAll', auth.checkAuth(['announcements'], config.PERMISSIONS.student, true), downloadFiles)
router.get('/:id/view', auth.checkAuth(['announcements'], config.PERMISSIONS.student, true), viewFile)
router.delete('/:id', auth.checkAuth(['edit_announcements'], config.PERMISSIONS.professor), deleteFile)

function downloadFile (req, res, next) {
  filesFunc.getFile(req.params.id, req.user).then(file => {
    let name = encodeURIComponent(file.name)
    res.writeHead(200, {
      'Content-Length': Buffer.byteLength(file.data),
      'Content-Type': file.contentType,
      'Content-Disposition': 'attachment;filename*=UTF-8\'\'' + name
    })
    res.end(file.data) // the second parameter is cashed to the browser
  }).catch(function (applicationError) {
    applicationError.type = 'downloadFile'
    applicationError.ip = apiFunctions.getClientIp(req)
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
          }).catch(function (err) {
            next(new ApplicationErrorClass('downloadFiles', null, 1111, err, 'Σφάλμα κατα την συμπίεση αρχείων', apiFunctions.getClientIp(req), 500))
          })
        } else {
          next(new ApplicationErrorClass('downloadFiles', null, 1112, null, 'Δεν έχετε δικαίωμα για αυτήν την ενέργεια', apiFunctions.getClientIp(req), 500))
        }
      } else {
        next(new ApplicationErrorClass('downloadFiles', null, 1116, null, 'Σφάλμα κατά την εύρεση αρχείου', apiFunctions.getClientIp(req), 500))
      }
    })
  } else {
    next(new ApplicationErrorClass('downloadFiles', null, 1113, null, 'Συνέβη κάποιο σφάλμα κατα την λήψη αρχείων', apiFunctions.getClientIp(req), 500))
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
      res.end(file.data) // the second parameter is cashed to the browser
    }
  }).catch(function (applicationError) {
    applicationError.type = 'viewFile'
    applicationError.ip = apiFunctions.getClientIp(req)
    next(applicationError)
  })
}

function deleteFile (req, res, next) {
  let fileId = req.params.id
  database.Announcements.findOne({'attachments': fileId}, function (err, announcement) {
    if (err || !announcement) {
      next(new ApplicationErrorClass('deleteFile', req.user.id, 1121, null, 'Σφάλμα κατα την εύρεση αρχείου', apiFunctions.getClientIp(req), 500))
    } else {
      if (announcement.publisher.id === req.user.id || req.user.scope === config.PERMISSIONS.admin) {
        announcement.attachments.pull(fileId)
        announcement.save(function (err) {
          if (err) {
            next(new ApplicationErrorClass('deleteFile', req.user.id, 1122, err, 'Σφάλμα κατα την διαγραφή αρχείου', apiFunctions.getClientIp(req), 500))
          } else {
            database.File.findOneAndRemove({_id: fileId}, function (err) {
              if (err) {
                next(new ApplicationErrorClass('deleteFile', req.user.id, 1123, err, 'Σφάλμα κατα την διαγραφή αρχείου', apiFunctions.getClientIp(req), 500))
              } else {
                res.status(200).json({
                  message: 'Το αρχείο διαγράφηκε επιτυχώς'
                })
              }
            })
          }
        })
      } else {
        next(new ApplicationErrorClass('deleteFile', req.user.id, 1124, err, 'Δεν έχετε δικαίωμα για αυτήν την ενέργεια', apiFunctions.getClientIp(req), 500))
      }
    }
  })
}

module.exports = {
  router: router
}
