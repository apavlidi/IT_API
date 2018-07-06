const express = require('express')
const router = express.Router()
const database = require('../../../configs/database')
const apiFunctions = require('../../apiFunctions')
const validSchemas = require('../joi')
const mongoose = require('mongoose')
const fs = require('fs')
const filesFunc = require('./functions')
const fileType = require('file-type')
const announcementsFunc = require('../announcements/functions')
const ApplicationErrorClass = require('../../applicationErrorClass')
const auth = require('../../../configs/auth')

router.get('/:id', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student, true), downloadFile)
router.get('/:announcementId/downloadAll', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student, true), downloadFiles)
router.get('/:id/view', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student, true), viewFile)
router.delete('/:id', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.professor, true), apiFunctions.validateInput('params', validSchemas.deleteFileFromAnnouncementSchema), deleteFile)

function downloadFile (req, res, next) {
  apiFunctions.sanitizeObject(req.params)
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    let fileId = req.params.id
    database.File.findOne({_id: fileId}).populate('_announcement', '_about').populate({
      path: '_announcement',
      populate: {path: '_about', select: 'public'}
    }).exec(function (err, file) {
      if (err) {
        next(new ApplicationErrorClass('downloadFile', req.user.id, 159, err, 'Συνέβει κάποιο σφάλμα κατα την διαγραφή της κατηγορίας', apiFunctions.getClientIp(req), 500))
      } else {
        console.log(file)
        if (file && file._announcement && file._announcement._about) {
          if ((file._announcement._about.public || req.user.id)) {
            let name = encodeURIComponent(file.name)
            res.writeHead(200, {
              'Content-Length': Buffer.byteLength(file.data),
              'Content-Type': file.contentType,
              'Content-Disposition': 'attachment;filename*=UTF-8\'\'' + name
            })
            res.end(file.data) //the second parameter is cashed to the browser
          } else {
            next(new ApplicationErrorClass('downloadFile', null, 160, null, 'Δεν έχετε δικαίωμα για αυτήν την ενέργεια', apiFunctions.getClientIp(req), 500))
          }
        } else {
          next(new ApplicationErrorClass('downloadFile', null, 161, null, 'Συνέβη κάποιο σφάλμα κατα την λήψη αρχείου', apiFunctions.getClientIp(req), 500))
        }
      }
    })
  } else {
    next(new ApplicationErrorClass('downloadFile', null, 161, null, 'Συνέβη κάποιο σφάλμα κατα την λήψη αρχείου', apiFunctions.getClientIp(req), 500))
  }
}

function downloadFiles (req, res, next) {
  apiFunctions.sanitizeObject(req.params)
  if (mongoose.Types.ObjectId.isValid(req.params.announcementId)) {
    let announcementId = req.params.announcementId
    database.Announcements.findOne({_id: announcementId}).populate('_about', 'public').exec(function (err, announcement) {
      //TODO check req.session.login
      if (announcement._about.public || req.user) {
        let files = announcement.attachments
        filesFunc.addToZip(files).then(function (finalZip) {
          finalZip
            .generateNodeStream({type: 'nodebuffer', streamFiles: true})
            .pipe(fs.createWriteStream('files.zip'))
            .on('finish', function () {
              finalZip.generateAsync({type: 'uint8array'}) //auto xriazetai giati an dn iparxi to file vgainei damaged/corrupted
                .then(function (content) {
                  saveAs(content, 'files.zip')
                })
              res.status(200).download('files.zip', function (err) {
                if (!err) {
                  fs.unlink('files.zip') //svisto afou to stilis edw isos to stelnoume sto /tmp
                }
              })
            })
        }).catch(function (err) {
          next(new ApplicationErrorClass('downloadFiles', null, 162, err, 'Σφάλμα κατα την συμπίεση αρχείων', apiFunctions.getClientIp(req), 500))
        })
      } else {
        next(new ApplicationErrorClass('downloadFiles', null, 163, null, 'Δεν έχετε δικαίωμα για αυτήν την ενέργεια', apiFunctions.getClientIp(req), 500))
      }
    })
  } else {
    next(new ApplicationErrorClass('downloadFiles', null, 164, null, 'Συνέβη κάποιο σφάλμα κατα την λήψη αρχείων', apiFunctions.getClientIp(req), 500))
  }
}

function viewFile (req, res, next) {
  apiFunctions.sanitizeObject(req.params)
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    let fileId = req.params.id
    database.File.findOne({_id: fileId}).populate('_announcement', '_about').populate({
      path: '_announcement',
      populate: {path: '_about', select: 'public'}
    }).exec(function (err, file) {
      if (err) {
        next(new ApplicationErrorClass('viewFile', null, 165, err, 'Συνέβη κάποιο σφάλμα κατα την προβολή αρχείου', apiFunctions.getClientIp(req), 500))
      } else {
        if (file && file._announcement && file._announcement._about) {
          if (file._announcement._about.public || req.user) {
            let type = fileType(file.data)
            if (type != null && filesFunc.browserMimeTypesSupported(type.mime)) { //here we can check what types we want to send depending if the browser supports it (eg pdf is supported)
              res.contentType(type.mime)
              res.send(file.data)
            } else {
              let name = encodeURIComponent(file.name)
              res.writeHead(200, {
                'Content-Type': file.contentType,
                'Content-Disposition': 'attachment;filename*=UTF-8\'\'' + name
              })
              res.end(file.data) //the second parameter is cashed to the browser
            }
          } else {
            next(new ApplicationErrorClass('viewFile', null, 166, null, 'Δεν έχετε δικαίωμα για αυτήν την ενέργεια', apiFunctions.getClientIp(req), 500))
          }
        } else {
          next(new ApplicationErrorClass('viewFile', null, 167, null, 'Συνέβη κάποιο σφάλμα κατα την προβολή αρχείου', apiFunctions.getClientIp(req), 500))
        }
      }
    })
  } else {
    next(new ApplicationErrorClass('viewFile', null, 168, null, 'Συνέβη κάποιο σφάλμα κατα την προβολή αρχείου', apiFunctions.getClientIp(req), 500))
  }
}

function deleteFile (req, res, next) {
  apiFunctions.sanitizeObject(req.params)
  let fileId = req.params.id

  database.Announcements.findOne({'attachments': fileId}, function (err, announcement) {
    if (err || !announcement) {
      next(new ApplicationErrorClass('deleteFile', req.user.id, 169, null, 'Σφάλμα κατα την εύρεση αρχείου', apiFunctions.getClientIp(req), 500))
    } else {
      //TODO Check if publisher is the same as the user or if its admin
      if (announcement.publisher.id == req.user.id || req.user.scope == PERMISSIONS.admin) {
        announcement.attachments.pull(fileId)
        announcement.save(function (err) {
          if (err) {
            next(new ApplicationErrorClass('deleteFile', req.user.id, 170, err, 'Σφάλμα κατα την διαγραφή αρχείου', apiFunctions.getClientIp(req), 500))
          } else {
            database.File.findOneAndRemove({_id: fileId}, function (err) {
              if (err) {
                next(new ApplicationErrorClass('deleteFile', req.user.id, 171, err, 'Σφάλμα κατα την διαγραφή αρχείου', apiFunctions.getClientIp(req), 500))
              } else {
                //logging
                // let applicationErrorClass = logging(req.session.user.id, 'DELETE', 'success', 'announcements', {
                //   track: 'deleteFileFromAnnouncement',
                //   text: 'Το αρχείο διαγράφηκε επιτυχώς με id: ' + fileId + ' απο την ανακοίνωση με id: ' + announcementId
                // }, req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress)
                // log.info(applicationErrorClass)
                //announcementsFunc.postToTeithe(announcement, 'edit')
                res.status(200).json({
                  message: 'Το αρχείο διαγράφηκε επιτυχώς',
                })
              }
            })
          }
        })
      } else {
        next(new ApplicationErrorClass('deleteFile', req.user.id, 172, err, 'Δεν έχετε δικαίωμα για αυτήν την ενέργεια', apiFunctions.getClientIp(req), 500))
      }
    }
  })
}

module.exports = {
  router: router
}
