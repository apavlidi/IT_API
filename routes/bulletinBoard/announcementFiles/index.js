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
let logError = require('./../../logError')

router.get('/:id', downloadFile)
router.get('/:announcementId/downloadAll', downloadFiles)
router.get('/:id/view', viewFile)
router.delete('/:id', apiFunctions.validateInput('params', validSchemas.deleteFileFromAnnouncementSchema), deleteFile)

function downloadFile (req, res) {
  apiFunctions.sanitizeObject(req.params)
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    let fileId = req.params.id
    database.File.findOne({_id: fileId}).populate('_announcement', '_about').populate({
      path: '_announcement',
      populate: {path: '_about', select: 'public'}
    }).exec(function (err, file) {
      if (err) {
        res.status(404).render('404.ejs', {
          // login: req.session.login,
          // user: req.session.user
        })
      } else {
        console.log(file)
        if ((file && file._announcement && file._announcement._about && file._announcement._about.public)) { // req.session.login
          let name = encodeURIComponent(file.name)
          res.writeHead(200, {
            'Content-Length': Buffer.byteLength(file.data),
            'Content-Type': file.contentType,
            'Content-Disposition': 'attachment;filename*=UTF-8\'\'' + name
          })
          res.end(file.data) //the second parameter is cashed to the browser
        } else {
          res.status(404).render('401.ejs', {
            //login: req.session.login,
            //   user: req.session.user
          })
        }
      }
    })
  } else {
    res.status(500).json({message: 'Συνέβη κάποιο σφάλμα'})
  }
}

function downloadFiles (req, res) {
  apiFunctions.sanitizeObject(req.params)
  if (mongoose.Types.ObjectId.isValid(req.params.announcementId)) {
    let announcementId = req.params.announcementId
    database.Announcements.findOne({_id: announcementId}).populate('_about', 'public').exec(function (err, announcement) {
      //TODO check req.session.login
      if (announcement._about.public) {
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
          res.status(500).json({message: 'Σφάλμα κατα την συμπίεση αρχείων'})
        })
      } else {
        res.status(404).render('401.ejs', {
          //login: req.session.login,
          //  user: req.session.user
        })
      }
    })

  } else {
    res.status(500).json({message: 'Συνέβη κάποιο σφάλμα'})
  }
}

function viewFile (req, res) {
  apiFunctions.sanitizeObject(req.params)
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    let fileId = req.params.id
    database.File.findOne({_id: fileId}).populate('_announcement', '_about').populate({
      path: '_announcement',
      populate: {path: '_about', select: 'public'}
    }).exec(function (err, file) {
      if (err) {
        res.status(404).render('404.ejs', {
          //login: req.session.login,
          //     user: req.session.user
        })
      } else {
        if (file && file._announcement && file._announcement._about) {
          if (file._announcement._about.public) {
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
            res.status(404).render('401.ejs', {
              //  login: req.session.login,
              //   user: req.session.user
            })
          }
        } else {
          res.status(404).render('404.ejs', {
            //login: req.session.login,
            //  user: req.session.user
          })
        }
      }
    })
  } else {
    res.status(500).json({message: 'Συνέβη κάποιο σφάλμα'})
  }
}

function deleteFile (req, res, next) {
  apiFunctions.sanitizeObject(req.params)
  let fileId = req.params.id

  database.Announcements.findOne({'attachments': fileId}, function (err, announcement) {
    if (err || !announcement) {

      next(new logError('unknown', 'DELETE', 'fail', 'announcements', err, 'deleteFile',
        'Σφάλμα κατα την εύρεση αρχείου με id: ' + fileId))
      res.status(500).json({message: 'Σφάλμα κατα την λήψη ανακοινώσεων'})
    } else {
      //TODO Check if publisher is the same as the user or if its admin
      //   if (announcement.publisher.id == req.session.user.id || req.session.user.scope == PERMISSIONS.admin) {
      announcement.attachments.pull(fileId)
      announcement.save(function (err) {
        if (err) {
          next(new logError('unknown', 'DELETE', 'fail', 'announcements', err, 'deleteFile',
            'Σφάλμα κατα την διαγραφή αρχείου με id: ' + fileId + ' απο την ανακοίνωση'))
        } else {
          database.File.findOneAndRemove({_id: fileId}, function (err) {
            if (err) {
              next(new logError('unknown', 'DELETE', 'fail', 'announcements', err, 'deleteFile',
                'Σφάλμα κατα την διαγραφή αρχείου με id: ' + fileId + ' απο την την βάση'))
              // res.status(500).json({message: 'Σφάλμα διαγραφής του αρχείου στην βάση'})
            } else {
              // let logEntry = logging(req.session.user.id, 'DELETE', 'success', 'announcements', {
              //   track: 'deleteFileFromAnnouncement',
              //   text: 'Το αρχείο διαγράφηκε επιτυχώς με id: ' + fileId + ' απο την ανακοίνωση με id: ' + announcementId
              // }, req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress)
              // log.info(logEntry)
              announcementsFunc.postToTeithe(announcement, 'edit')
              res.status(200).json({
                message: 'Το αρχείο διαγράφηκε επιτυχώς',
              })
            }
          })

        }
      })
      // } else {
      //   let logEntry = logging(req.session.user.id, 'EDIT', 'fail', 'announcements', {
      //     track: 'deleteFileFromAnnouncement',
      //     text: 'Μη εξουσιοδοτημένος χρήστης'
      //   }, req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress)
      //   log.error(logEntry)
      //   res.status(401).json({message: 'Δεν έχεις δικάιωμα για αυτήν την ενέργεια!'})
      // }
    }
  })
}

module.exports = {
  router: router
}
