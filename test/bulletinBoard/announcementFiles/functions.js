const functionsSetup = require('../setupDB')

let rewire = require('rewire'),
  functionsPrivate = rewire('./../../../routes/bulletinBoard/announcementFiles/functions')
let functionsPublic = require('./../../../routes/bulletinBoard/announcementFiles/functions')

describe('announcementsFiles', () => {
  let announcementPublicIDExample
  let announcementPrivateIDExample
  let announcementIDToBeDeleted
  let categoryIDPrivateExample
  let categoryIDPublicExample
  let filePublicIDExample
  let filePrivateIDExample
  let fileIDToBeDeleted
  let announcementWithFileExample

  before(function (done) {
    functionsSetup.removeAllCollections().then(() => {
      return functionsSetup.createCategoryPublicExample()
    }).then(categoryIDPublicExampleReturned => {
      categoryIDPublicExample = categoryIDPublicExampleReturned
      return functionsSetup.createCategoryPrivateExample()
    }).then(categoryIDPrivateExampleReturned => {
      categoryIDPrivateExample = categoryIDPrivateExampleReturned
      return functionsSetup.createAnnouncementExample(categoryIDPublicExample)
    }).then(announcementPublicIDExampleReturned => {
      announcementPublicIDExample = announcementPublicIDExampleReturned
      return functionsSetup.createAnnouncementExample(categoryIDPrivateExample)
    }).then(categoryIDPrivateExampleReturned => {
      announcementPrivateIDExample = categoryIDPrivateExampleReturned
      return functionsSetup.createAnnouncementExampleToBeDeleted(categoryIDPublicExample)
    }).then(announcementIDToBeDeletedReturned => {
      announcementIDToBeDeleted = announcementIDToBeDeletedReturned
      return functionsSetup.createFileExample(announcementPublicIDExample)
    }).then(filePublicID => {
      filePublicIDExample = filePublicID
      return functionsSetup.createFileExample(announcementPrivateIDExample)
    }).then(filePrivateID => {
      filePrivateIDExample = filePrivateID
      return functionsSetup.createFileExample(announcementPublicIDExample)
    }).then(fileIDToBeDeletedExample => {
      fileIDToBeDeleted = fileIDToBeDeletedExample
      return functionsSetup.createAnnouncementWithFileExample(categoryIDPublicExample, fileIDToBeDeletedExample)
    }).then(announcementWithFileIDExample => {
      announcementWithFileExample = announcementWithFileIDExample
      done()
    }).catch(function (err) {
      throw new Error(err)
    })
  })

  after(function (done) {
    functionsSetup.removeAllCollections().then(() => {
      done()
    }).catch(function (err) {
      throw new Error(err)
    })
  })

  context('routes', () => {

    context('downloadFile', () => {

      it('it should download a public file on valid file when authenticated', (done) => {
        chai.request(server)
          .get('/files/' + filePublicIDExample + '?' + access_token)
          .end((err, res) => {
            res.should.have.a.property('header')
            res.should.have.a.property('body')
            let header = res.header
            header.should.have.a.property('content-type')
            res.should.have.status(200)
            done()
          })
      })

      it('it should download a public file on valid file when NOT authenticated', (done) => {
        chai.request(server)
          .get('/files/' + filePublicIDExample)
          .end((err, res) => {
            res.should.have.a.property('header')
            res.should.have.a.property('body')
            let header = res.header
            header.should.have.a.property('content-type')
            res.should.have.status(200)
            done()
          })
      })

      it('it should download a private file on valid file when authenticated', (done) => {
        chai.request(server)
          .get('/files/' + filePrivateIDExample + '?' + access_token)
          .end((err, res) => {
            res.should.have.a.property('header')
            res.should.have.a.property('body')
            let header = res.header
            header.should.have.a.property('content-type')
            res.should.have.status(200)
            done()
          })
      })

      it('it should return a 500 code when try to download a private file when NOT authenticated', (done) => {
        chai.request(server)
          .get('/files/' + filePrivateIDExample)
          .end((err, res) => {
            res.should.have.status(500)
            done()
          })
      })

      it('it should return a 500 code on invalid file ID', (done) => {
        let randomID = mongoose.Types.ObjectId()
        chai.request(server)
          .get('/files/' + randomID + '?' + access_token)
          .end((err, res) => {
            console.log(res)
            res.should.have.status(500)
            done()
          })
      })
    })

    context('downloadFiles', () => {

      it('it should download all files on public announcement when authenticated', (done) => {
        chai.request(server)
          .get('/files/' + announcementPublicIDExample + '/downloadAll?' + access_token)
          .end((err, res) => {
            res.should.have.a.property('header')
            res.should.have.a.property('body')
            let header = res.header
            header.should.have.a.property('content-type')
            let filename = header['content-disposition']
            filename.should.equals('attachment; filename="files.zip"')
            res.should.have.status(200)
            done()
          })
      })

      it('it should download all files on public announcement when NOT authenticated', (done) => {
        chai.request(server)
          .get('/files/' + announcementPublicIDExample + '/downloadAll')
          .end((err, res) => {
            res.should.have.a.property('header')
            res.should.have.a.property('body')
            let header = res.header
            header.should.have.a.property('content-type')
            let filename = header['content-disposition']
            filename.should.equals('attachment; filename="files.zip"')
            res.should.have.status(200)
            done()
          })
      })

      it('it should download all files on private announcement when authenticated', (done) => {
        chai.request(server)
          .get('/files/' + announcementPublicIDExample + '/downloadAll?' + access_token)
          .end((err, res) => {
            res.should.have.a.property('header')
            res.should.have.a.property('body')
            let header = res.header
            header.should.have.a.property('content-type')
            let filename = header['content-disposition']
            filename.should.equals('attachment; filename="files.zip"')
            res.should.have.status(200)
            done()
          })
      })

      it('it should return a 500 code when try to download all files on private announcement when NOT authenticated', (done) => {
        chai.request(server)
          .get('/files/' + announcementPrivateIDExample + '/downloadAll')
          .end((err, res) => {
            res.should.have.status(500)
            done()
          })
      })

      it.skip('it should return 500 code to invalid announcementID', (done) => {
        let randomID = mongoose.Types.ObjectId()
        chai.request(server)
          .get('/files/' + randomID + '/downloadAll')
          .end((err, res) => {
            res.should.have.status(500)
            done()
          })
      })

    })

    context('viewFile', () => {

      it('it should view a public file when authenticated', (done) => {
        chai.request(server)
          .get('/files/' + filePublicIDExample + '/view?' + access_token)
          .end((err, res) => {
            res.should.have.a.property('header')
            res.should.have.a.property('body')
            let header = res.header
            header.should.have.a.property('content-type')
            let filename = header['content-disposition']
            filename.should.contains('attachment;filename*=UTF-8')
            res.should.have.status(200)
            done()
          })
      })

      it('it should view a public file when NOT authenticated', (done) => {
        chai.request(server)
          .get('/files/' + filePublicIDExample + '/view')
          .end((err, res) => {
            res.should.have.a.property('header')
            res.should.have.a.property('body')
            let header = res.header
            header.should.have.a.property('content-type')
            let filename = header['content-disposition']
            filename.should.contains('attachment;filename*=UTF-8')
            res.should.have.status(200)
            done()
          })
      })

      it('it should view a private file when authenticated', (done) => {
        chai.request(server)
          .get('/files/' + filePrivateIDExample + '/view?' + access_token)
          .end((err, res) => {
            res.should.have.a.property('header')
            res.should.have.a.property('body')
            let header = res.header
            header.should.have.a.property('content-type')
            let filename = header['content-disposition']
            filename.should.contains('attachment;filename*=UTF-8')
            res.should.have.status(200)
            done()
          })
      })

      it('it should return 500 code to a private file when NOT authenticated', (done) => {
        chai.request(server)
          .get('/files/' + filePrivateIDExample + '/view')
          .end((err, res) => {
            res.should.have.status(500)
            done()
          })
      })

      it('it should return 500 code to invalid file', (done) => {
        let randomID = mongoose.Types.ObjectId()
        chai.request(server)
          .get('/files/' + randomID + '/view')
          .end((err, res) => {
            res.should.have.status(500)
            done()
          })
      })

    })

    context('deleteFile', () => {

      it('it should delete a public file when authenticated', (done) => {
        console.log(fileIDToBeDeleted)
        chai.request(server)
          .delete('/files/' + fileIDToBeDeleted + '?' + access_token)
          .end((err, res) => {
            res.should.have.status(200)
            done()
          })
      })

      it('it should return a 400 error when deleting without authentication', (done) => {
        chai.request(server)
          .delete('/files/' + fileIDToBeDeleted)
          .end((err, res) => {
            res.should.have.status(400)
            done()
          })
      })

    })

  })

  context('functions', () => {

    context('getFile', () => {

      it('it should return a public file when not logged in', (done) => {
        functionsPublic.getFile(filePublicIDExample, false).then(file => {
          file.should.be.an('object')
          file.should.have.property('_announcement')
          done()
        }).catch(err => {
          done(new Error())
        })
      })

      it('it should return a public file when logged in', (done) => {
        functionsPublic.getFile(filePublicIDExample, true).then(file => {
          file.should.be.an('object')
          file.should.have.property('_announcement')
          done()
        }).catch(err => {
          done(new Error())
        })
      })

      it('it should return a private file when logged in', (done) => {
        functionsPublic.getFile(filePrivateIDExample, true).then(file => {
          file.should.be.an('object')
          file.should.have.property('_announcement')
          done()
        }).catch(err => {
          done(new Error())
        })
      })

      it('it should NOT have access to a private file when not logged in', (done) => {
        functionsPublic.getFile(filePrivateIDExample, false).then(file => {
          done(new Error())
        }).catch(applicationError => {
          applicationError.should.have.property('code')
          let code = applicationError.code
          code.should.equal(1102)
          done()
        })
      })

      it('it should NOT return a file with invalid ID', (done) => {
        let invalidID = 'test'
        functionsPublic.getFile(invalidID, false).then(file => {
          done(new Error())
        }).catch(applicationError => {
          applicationError.should.have.property('code')
          let code = applicationError.code
          code.should.equal(1104)
          done()
        })
      })

      it('it should throw an error when file is not found', (done) => {
        let randomID = mongoose.Types.ObjectId()
        functionsPublic.getFile(randomID, false).then(file => {
          done(new Error())
        }).catch(applicationError => {
          applicationError.should.have.property('code')
          let code = applicationError.code
          code.should.equal(1101)
          done()
        })
      })

    })

    context('browserMimeTypesSupported', () => {

      it('it should return true on valid mimeType', (done) => {
        let validType = 'image/gif'
        let result = functionsPublic.browserMimeTypesSupported(validType)
        result.should.equal(true)
        done()
      })

      it('it should return false on invalid mimeType', (done) => {
        let validType = 'Invalid type'
        let result = functionsPublic.browserMimeTypesSupported(validType)
        result.should.equal(false)
        done()
      })
    })

    context('addToZip', () => {

      it('it should return a zip with all the files', (done) => {
        let filesIDs = [filePublicIDExample, filePrivateIDExample]
        functionsPublic.addToZip(filesIDs).then(zip => {
          zip.should.have.be.an('object')
          zip.should.have.property('files')
          done()
        }).catch(applicationError => {
          done(new Error())
        })
      })

      it.skip('it should return an error on invalid fileID', (done) => {
        let invalidFileID = mongoose.Types.ObjectId()
        let filesIDs = [filePublicIDExample, invalidFileID]
        functionsPublic.addToZip(filesIDs).then(zip => {
          done(new Error())
        }).catch(applicationError => {
          applicationError.should.have.property('code')
          let code = applicationError.code
          code.should.equal(1114)
          done()
        })
      })

    })

  })

})