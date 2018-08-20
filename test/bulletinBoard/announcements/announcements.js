// const functionsSetup = require('../setupDB')
//
// let rewire = require('rewire'),
//   functionsPrivate = rewire('./../../../routes/bulletinBoard/announcements/functions')
// let functionsPublic = require('./../../../routes/bulletinBoard/announcements/functions')
//
// let functionsFileChecks = require('./../../../routes/bulletinBoard/announcements/fileChecks')
//
// describe('announcements', () => {
//   let announcementPublicIDExample
//   let announcementPrivateIDExample
//   let announcementIDToBeDeleted
//   let categoryIDPrivateExample
//   let categoryIDPublicExample
//   let fileIDExample
//
//   let publisher = {
//     publisherId: '5106',
//     publisherName: 'alexis'
//   }
//
//   before(function (done) {
//     functionsSetup.removeAllCollections().then(() => {
//       return functionsSetup.createCategoryPublicExample()
//     }).then(categoryIDPublicExampleReturned => {
//       categoryIDPublicExample = categoryIDPublicExampleReturned
//       return functionsSetup.createCategoryPrivateExample()
//     }).then(categoryIDPrivateExampleReturned => {
//       categoryIDPrivateExample = categoryIDPrivateExampleReturned
//       return functionsSetup.createAnnouncementExample(categoryIDPublicExample)
//     }).then(announcementPublicIDExampleReturned => {
//       announcementPublicIDExample = announcementPublicIDExampleReturned
//       return functionsSetup.createAnnouncementExample(categoryIDPrivateExample)
//     }).then(categoryIDPrivateExampleReturned => {
//       announcementPrivateIDExample = categoryIDPrivateExampleReturned
//       return functionsSetup.createAnnouncementExampleToBeDeleted(categoryIDPublicExample)
//     }).then(announcementIDToBeDeletedReturned => {
//       announcementIDToBeDeleted = announcementIDToBeDeletedReturned
//       return functionsSetup.createFileExample()
//     }).then(fileID => {
//       fileIDExample = fileID
//       done()
//     }).catch(function (err) {
//       throw new Error(err)
//     })
//   })
//
//   after(function (done) {
//     functionsSetup.removeAllCollections().then(() => {
//       done()
//     }).catch(function (err) {
//       throw new Error(err)
//     })
//   })
//
//   context('routes', () => {
//
//     context('getAnnouncements', () => {
//
//       it('it should GET all the announcements with authentication', (done) => {
//         chai.request(server)
//           .get('/announcements?' + access_token)
//           .end((err, res) => {
//             res.should.have.status(200)
//             res.body.should.be.a('array')
//             res.body[0].should.have.property('title')
//             done()
//           })
//       })
//
//       it('it should NOT GET all the announcements without authentication', (done) => {
//         chai.request(server)
//           .get('/announcements')
//           .end((err, res) => {
//             res.should.have.status(400)
//             done()
//           })
//       })
//     })
//
//     context('getAnnouncements', () => {
//       it('it should GET all public announcements without authentication', (done) => {
//         chai.request(server)
//           .get('/announcements/public')
//           .end((err, res) => {
//             res.should.have.status(200)
//             res.body.should.be.a('array')
//             done()
//           })
//       })
//
//       it('it should GET all public announcements with authentication', (done) => {
//         chai.request(server)
//           .get('/announcements/public?' + access_token)
//           .end((err, res) => {
//             res.should.have.status(200)
//             res.body.should.be.a('array')
//             done()
//           })
//       })
//     })
//
//     it('it should GET the annoucnement', (done) => {
//       chai.request(server)
//         .get('/announcements/' + announcementPublicIDExample + '?' + access_token)
//         .end((err, res) => {
//           res.should.have.status(200)
//           res.body.should.be.an('object')
//           res.body.should.have.property('title')
//           done()
//         })
//     })
//
//     it('it should GET all the annoucnements with rss response with authentication', (done) => {
//       chai.request(server)
//         .get('/announcements/feed/rss?' + access_token)
//         .end((err, res) => {
//           expect(res).to.have.header('content-type', 'text/xml; charset=utf-8')
//           res.should.have.status(200)
//           done()
//         })
//     })
//
//     it('it should GET all the annoucnements with atom response with authentication', (done) => {
//       chai.request(server)
//         .get('/announcements/feed/atom?' + access_token)
//         .end((err, res) => {
//           expect(res).to.have.header('content-type', 'text/plain; charset=utf-8')
//           res.should.have.status(200)
//           done()
//         })
//     })
//
//     it('it should GET all the annoucnements with json response with authentication', (done) => {
//       chai.request(server)
//         .get('/announcements/feed/json?' + access_token)
//         .end((err, res) => {
//           expect(res).to.have.header('content-type', 'application/json; charset=utf-8')
//           res.should.have.status(200)
//           done()
//         })
//     })
//
//     it.skip('it should POST a new announcement with authentication', (done) => {
//       publisher = JSON.stringify(publisher)
//       chai.request(server)
//         .post('/announcements?' + access_token)
//         .send({
//           title: 'test2',
//           text: 'test2',
//           textEn: 'test2',
//           titleEn: 'test2',
//           publisher,
//           about: categoryIDPublicExample
//         }).end((err, res) => {
//         res.should.have.status(201)
//         done()
//       })
//     })
//
//     it('it should NOT POST a new announcement without authentication', (done) => {
//       publisher = JSON.stringify(publisher)
//       chai.request(server)
//         .post('/announcements')
//         .send({
//           title: 'test2',
//           text: 'test2',
//           textEn: 'test2',
//           titleEn: 'test2',
//           publisher,
//           about: categoryIDPublicExample
//         }).end((err, res) => {
//         res.should.have.status(400)
//         done()
//       })
//     })
//
//     it('it should NOT POST a new announcement when missing title attribute with authentication', (done) => {
//       publisher = JSON.stringify(publisher)
//       chai.request(server)
//         .post('/announcements?' + access_token)
//         .send({
//           text: 'test2',
//           textEn: 'test2',
//           titleEn: 'test2',
//           publisher,
//           about: categoryIDPublicExample
//         }).end((err, res) => {
//         res.should.have.status(500)
//         done()
//       })
//     })
//
//     it('it should NOT POST a new announcement when _about attribute does not exist with authentication', (done) => {
//       let randomMongooseID = mongoose.Types.ObjectId()
//       publisher = JSON.stringify(publisher)
//       chai.request(server)
//         .post('/announcements?' + access_token)
//         .send({
//           title: 'test2',
//           text: 'test2',
//           textEn: 'test2',
//           titleEn: 'test2',
//           publisher,
//           about: randomMongooseID
//         }).end((err, res) => {
//         res.should.have.status(500)
//         done()
//       })
//     })
//
//     it('it should DELETE an announcement with authentication', (done) => {
//       chai.request(server)
//         .delete('/announcements/' + announcementIDToBeDeleted + '?' + access_token).end((err, res) => {
//         res.should.have.status(200)
//         done()
//       })
//     })
//
//     it('it should return error when deleting a non-existing announcement with authentication', (done) => {
//       let announcementIDRandom = mongoose.Types.ObjectId()
//
//       chai.request(server)
//         .delete('/announcements/' + announcementIDRandom + '?' + access_token).end((err, res) => {
//         res.should.have.status(500)
//         done()
//       })
//     })
//
//     it('it should return error when deleting passing a not valid id for deleting announcement with authentication', (done) => {
//       chai.request(server)
//         .delete('/announcements/123456?' + access_token).end((err, res) => {
//         res.should.have.status(500)
//         done()
//       })
//     })
//
//     it('it should PATCH an announcement with authentication', (done) => {
//       chai.request(server)
//         .patch('/announcements/' + announcementPublicIDExample + '?' + access_token)
//         .send({
//           title: 'test3',
//           text: 'test3',
//           textEn: 'test2',
//           titleEn: 'test2',
//           about: categoryIDPublicExample
//         }).end((err, res) => {
//         res.should.have.status(201)
//         done()
//       })
//     })
//
//   })
//
//   context('functions', () => {
//
//     context('fileChecks', () => {
//
//       context('checkFileType', () => {
//
//         it('it should return true on checkFileType with valid type', (done) => {
//           let result = functionsFileChecks.checkFileType('text/plain')
//           result.should.equal(true)
//           done()
//         })
//
//         it('it should return false with invalid type', (done) => {
//           let result = functionsFileChecks.checkFileType('invalid/Type')
//           result.should.equal(false)
//           done()
//         })
//
//         it('it should return false with invalid type of attribute', (done) => {
//           let result = functionsFileChecks.checkFileType(555)
//           result.should.equal(false)
//           done()
//         })
//
//       })
//
//       context('validateFileSize', () => {
//
//         it('it should return true  with valid size', (done) => {
//           let result = functionsFileChecks.validateFileSize(1000)
//           result.should.equal(true)
//           done()
//         })
//
//         it('it should return false with invalid size', (done) => {
//           let result = functionsFileChecks.validateFileSize(52428855)
//           result.should.equal(false)
//           done()
//         })
//
//         it('it should return false with invalid size type', (done) => {
//           let result = functionsFileChecks.validateFileSize('string')
//           result.should.equal(false)
//           done()
//         })
//
//       })
//
//     })
//
//     context('functions', () => {
//
//       context('validatePublisher', () => {
//         it('should return true when publisher is valid', (done) => {
//           functionsPublic.validatePublisher(5106).then(result => {
//             result.should.equal(true)
//             done()
//           })
//         })
//
//         it('should return false when publisher is invalid', (done) => {
//           functionsPublic.validatePublisher(9999).then(result => {
//             result.should.equal(false)
//             done()
//           })
//         })
//
//         it('should return false when publisher type is invalid', (done) => {
//           functionsPublic.validatePublisher('string').then(result => {
//             result.should.equal(false)
//             done()
//           })
//         })
//       })
//
//       context('getDescriptionRSSDependOnLogged', () => {
//
//         it('should return "Όλες οι ανακοινώσεις" when is authenticated', (done) => {
//           let private_func = functionsPrivate.__get__('getDescriptionRSSDependOnLogged')
//           let authenticated = true
//           let result = private_func(authenticated)
//           result.should.be.a('string')
//           result.should.equal('Όλες οι ανακοινώσεις')
//           done()
//         })
//
//         it('should return "Όλες οι δημόσιες ανακοινώσεις" when isn`t authenticated', (done) => {
//           let private_func = functionsPrivate.__get__('getDescriptionRSSDependOnLogged')
//           let authenticated = false
//           let result = private_func(authenticated)
//           result.should.be.a('string')
//           result.should.equal('Όλες οι δημόσιες ανακοινώσεις')
//           done()
//         })
//
//         it('should return "Όλες οι δημόσιες ανακοινώσεις" when type of parameter is not boolean', (done) => {
//           let private_func = functionsPrivate.__get__('getDescriptionRSSDependOnLogged')
//           let authenticated = 'string'
//           let result = private_func(authenticated)
//           result.should.be.a('string')
//           result.should.equal('Όλες οι δημόσιες ανακοινώσεις')
//           done()
//         })
//
//         it('should return "Όλες οι δημόσιες ανακοινώσεις" when type of parameter is not boolean', (done) => {
//           let private_func = functionsPrivate.__get__('getDescriptionRSSDependOnLogged')
//           let authenticated = 'string'
//           let result = private_func(authenticated)
//           result.should.be.a('string')
//           result.should.equal('Όλες οι δημόσιες ανακοινώσεις')
//           done()
//         })
//
//       })
//
//       context('getDescriptionRSSLogged', () => {
//
//         it('should contain "Ανακοινώσεις για τις παρακάτω κατηγορίες: " when passing rssCategories as parameter', (done) => {
//           var private_func = functionsPrivate.__get__('getDescriptionRSSLogged')
//           let rssCategories = ['12345']
//           let result = private_func(rssCategories)
//           result.should.be.a('string')
//           result.should.contains('Ανακοινώσεις για τις παρακάτω κατηγορίες: ')
//           done()
//         })
//
//         it('should contain an empty string like "" when not passing rssCategories as parameters', (done) => {
//           let private_func = functionsPrivate.__get__('getDescriptionRSSLogged')
//           let rssCategories = []
//           let result = private_func(rssCategories)
//           result.should.be.a('string')
//           result.should.contains('')
//           done()
//         })
//
//       })
//
//       context('appendPostsToFeed', () => {
//
//         it('should push 2 posts to the feed', (done) => {
//           const Feed = require('feed')
//           let posts = []
//           let announcementEntry = {
//             _id: mongoose.Types.ObjectId(),
//             title: 'Test title',
//             titleEn: 'Test title',
//             text: 'Test text',
//             textEn: 'Test text',
//             publisher: publisher,
//             _about: mongoose.Types.ObjectId()
//           }
//           let announcementEntry2 = {
//             _id: mongoose.Types.ObjectId(),
//             title: 'Test title',
//             titleEn: 'Test title',
//             text: 'Test text',
//             textEn: 'Test text',
//             publisher: publisher,
//             _about: mongoose.Types.ObjectId()
//           }
//           posts.push(announcementEntry)
//           posts.push(announcementEntry2)
//           let feed = new Feed()
//           let privateFunc = functionsPrivate.__get__('appendPostsToFeed')
//           privateFunc(feed, posts).then(() => {
//             feed.should.be.an('object')
//             feed.should.have.a.property('items')
//             let items = feed.items
//             items.should.have.lengthOf(2)
//             done()
//           }).catch(() => {
//             done(new Error())
//           })
//         })
//
//       })
//
//       context('createFeedObj', () => {
//
//         it('should contain a title "Τμήμα Πληροφορικής - Ανακοινώσεις"', (done) => {
//           var private_func = functionsPrivate.__get__('createFeedObj')
//           let result = private_func()
//           result.should.be.an('object')
//           result.should.have.a.property('options')
//           let title = result.options.title
//           title.should.equal('Τμήμα Πληροφορικής - Ανακοινώσεις')
//           done()
//         })
//
//         it('should contain a desciption based on what you passed as parameter', (done) => {
//           var private_func = functionsPrivate.__get__('createFeedObj')
//           let description = 'Sample Description'
//           let result = private_func(description)
//           result.should.be.an('object')
//           result.should.have.a.property('options')
//           let descriptionAttr = result.options.description
//           descriptionAttr.should.equal(description)
//           done()
//         })
//
//         it('should contain an undefined description if you pass nothing as parameter', (done) => {
//           var private_func = functionsPrivate.__get__('createFeedObj')
//           let result = private_func()
//           result.should.be.an('object')
//           result.should.have.a.property('options')
//           let descriptionAttr = result.options.description
//           should.equal(descriptionAttr, undefined)
//           done()
//         })
//
//       })
//
//       context('checkFileInput', () => {
//
//         it('should return true when file object is valid', (done) => {
//           let private_func = functionsPrivate.__get__('checkFileInput')
//           let file = {
//             mimetype: 'application/mspowerpoint',
//             data: 'Sample data'
//           }
//           let result = private_func(file)
//           result.should.equal(true)
//           done()
//         })
//
//         it('should return false when file mimetype is invalid', (done) => {
//           let private_func = functionsPrivate.__get__('checkFileInput')
//           let file = {
//             mimetype: 'Invalid Data',
//             data: 'Sample data'
//           }
//           let result = private_func(file)
//           result.should.equal(false)
//           done()
//         })
//
//         it('should return false when data is not a string', (done) => {
//           let private_func = functionsPrivate.__get__('checkFileInput')
//           let file = {
//             mimetype: 'application/mspowerpoint',
//             data: -5
//           }
//           let result = private_func(file)
//           result.should.equal(false)
//           done()
//         })
//
//         it('should return false when data is empty and mimetype is invalid', (done) => {
//           let private_func = functionsPrivate.__get__('checkFileInput')
//           let file = {
//             mimetype: 'Invalid Type',
//             data: -4
//           }
//           let result = private_func(file)
//           result.should.equal(false)
//           done()
//         })
//
//       })
//
//       context('gatherFilesInput', () => {
//
//         it('should gather 3 valid files', (done) => {
//           let files = [{data: 'Sample data 1', mimetype: 'text/plain'},
//             {data: 'Sample data 2', mimetype: 'text/plain'},
//             {data: 'Sample data 3', mimetype: 'text/plain'}]
//           functionsPublic.gatherFilesInput(files).then(result => {
//             result.should.be.an('array')
//             result.should.have.lengthOf(3)
//             done()
//           })
//         })
//
//         it('should gather 2 valid files', (done) => {
//           let files = [{data: 'Sample data 1', mimetype: 'text/plain'},
//             {data: 'Sample data 2', mimetype: 'Not valid'},
//             {data: 'Sample data 2', mimetype: 'text/plain'}]
//           functionsPublic.gatherFilesInput(files).then(result => {
//             result.should.be.an('array')
//             result.should.have.lengthOf(2)
//             done()
//           })
//         })
//
//         it('should gather 1 valid file', (done) => {
//           let file = {data: 'Sample data 1', mimetype: 'text/plain'}
//           functionsPublic.gatherFilesInput(file).then(result => {
//             result.should.be.an('array')
//             result.should.have.lengthOf(1)
//             done()
//           })
//         })
//
//       })
//
//       context('pushAllFiles', () => {
//
//         it('should push 2 valid files', (done) => {
//           let files = [{data: 'Sample data 1', mimetype: 'text/plain'},
//             {data: 'Sample data 2', mimetype: 'Not valid'},
//             {data: 'Sample data 2', mimetype: 'text/plain'}]
//           let private_func = functionsPrivate.__get__('pushAllFiles')
//           let result = private_func(files)
//           result.should.be.an('array')
//           result.should.have.lengthOf(2)
//           done()
//         })
//
//         it('should push 0 valid files when input is empty array', (done) => {
//           let files = []
//           let private_func = functionsPrivate.__get__('pushAllFiles')
//           let result = private_func(files)
//           result.should.be.an('array')
//           result.should.have.lengthOf(0)
//           done()
//         })
//
//       })
//
//       context('buildEmailBody', () => {
//
//         it('should return a text based on parameters passed', (done) => {
//           let private_func = functionsPrivate.__get__('buildEmailBody')
//           let publisher = 'Alexis', text = 'Sample text', title = 'Sample Title', categoryName = '5th Semester',
//             link = 'example.gr'
//           let result = private_func(publisher, text, title, categoryName, link)
//           result.should.be.a('string')
//           result.should.to.contains('Μια νεα ανακοίνωση δημιουργήθηκε απο')
//           result.should.to.contains('Alexis')
//           result.should.to.contains('Sample text')
//           result.should.to.contains('Sample Title')
//           result.should.to.contains('5th Semester')
//           result.should.to.contains('example.gr')
//           done()
//         })
//
//       })
//
//       context('formatDate', () => {
//
//         it('should return a date with month name', (done) => {
//           let private_func = functionsPrivate.__get__('formatDate')
//           let isoDate = new Date(2018, 11, 24, 10, 33, 30, 0)
//           let result = private_func(isoDate, true)
//           result.should.be.a('string')
//           result.should.contains('24 Δεκ 2018 10:33')
//           done()
//         })
//
//         it('should return a date with backslashes', (done) => {
//           let private_func = functionsPrivate.__get__('formatDate')
//           let isoDate = new Date(2018, 11, 24, 10, 33, 30, 0)
//           let result = private_func(isoDate, false)
//           result.should.be.a('string')
//           result.should.contains('24/11/2018 10:33')
//           done()
//         })
//
//       })
//
//       context('createNotification', () => {
//
//         it('should return a new Notification', (done) => {
//           let announcementID = mongoose.Types.ObjectId()
//           let publisher = {nameEn: 'Alexis', id: '12345', nameEl: 'Αλεξης'}
//           functionsPublic.createNotification(announcementID, publisher).then((result) => {
//             result.should.be.an('object')
//             result.should.have.a.property('related')
//             result.should.have.a.property('userId')
//             done()
//           })
//         })
//
//         it('should return an error when passing invalid ID', (done) => {
//           let announcementID = 'Invalid ID'
//           let publisher = {nameEn: 'Alexis', id: '12345', nameEl: 'Αλεξης'}
//           functionsPublic.createNotification(announcementID, publisher).then((result) => {
//             done(new Error())
//           }).catch((err) => {
//             done()
//           })
//         })
//
//         it('should return an error when save fails', (done) => {
//           let announcementID = mongoose.Types.ObjectId()
//           Object.defineProperty(database.Notification.prototype, 'save', {
//             value: database.Notification.prototype.save,
//             configurable: true,
//           })
//
//           const NotificationMocked = sinon.mock(database.Notification.prototype)
//           NotificationMocked.expects('save').yields(new Error())
//
//           let publisher = {nameEn: 'Alexis', id: '12345', nameEl: 'Αλεξης', invalid: 'Fake data'}
//           functionsPublic.createNotification(announcementID, publisher).then((result) => {
//             database.Notification.prototype.save.restore()
//             done(new Error())
//           }).catch((err) => {
//             database.Notification.prototype.save.restore()
//             done()
//           })
//         })
//
//       })
//
//       context('checkIfEntryExists', () => {
//
//         it('should return a document when entry exists', (done) => {
//           functionsPublic.checkIfEntryExists(announcementPublicIDExample, database.Announcements).then((result) => {
//             done()
//           }).catch((err) => {
//             done(new Error())
//           })
//         })
//
//         it('should return an error when entry doesn`t exist', (done) => {
//           let announcementIDRandom = mongoose.Types.ObjectId()
//           functionsPublic.checkIfEntryExists(announcementIDRandom, database.Announcements).then((result) => {
//             done(new Error())
//           }).catch((err) => {
//             done()
//           })
//         })
//
//       })
//
//       context('getAnnouncementsRSSPromise', () => {
//         it('should return an xml on correct values', (done) => {
//           let rssCategories = ['12345']
//           let categoryValues = ['12345']
//           let feedType = 'rss'
//           let announcements = [{
//             _id: mongoose.Types.ObjectId(),
//             title: 'Test title',
//             titleEn: 'Test title',
//             text: 'Test text',
//             textEn: 'Test text',
//             publisher: publisher,
//             _about: mongoose.Types.ObjectId()
//           }]
//           let res = {}
//           res.set = function () {
//             return
//           }
//           functionsPublic.getAnnouncementsRSSPromise(announcements, rssCategories, categoryValues, feedType, res, true).then((result) => {
//             result.should.contains('<?xml version="1.0" encoding="utf-8"?>')
//             done()
//           }).catch((err) => {
//             done(new Error())
//           })
//         })
//
//       })
//
//       context('createFileEntries', () => {
//
//         it('should return 3 fileIDs', (done) => {
//           let files = [{name: 'name1', data: 'Sample data 1', mimetype: 'text/plain'},
//             {name: 'name2', data: 'Sample data 2', mimetype: 'text/plain'},
//             {name: 'name3', data: 'Sample data 3', mimetype: 'text/plain'}]
//           functionsPublic.createFileEntries(files, announcementPublicIDExample).then(fileIDs => {
//             fileIDs.should.be.an('array')
//             fileIDs.should.have.lengthOf(3)
//             done()
//           }).catch(err => {
//             done(new Error())
//           })
//         })
//
//       })
//
//       context('findEmailsFromUserIds', () => {
//
//         it('should return email of registered id', (done) => {
//           let private_func = functionsPrivate.__get__('findEmailsFromUserIds')
//           let registeredIDs = ['5106']
//           private_func(registeredIDs).then(emails => {
//             emails.should.be.an('array')
//             emails.should.contains('apavlidi@it.teithe.gr')
//             done()
//           }).catch(err => {
//             done(new Error())
//           })
//         })
//
//         it('should return no email on empty array', (done) => {
//           let private_func = functionsPrivate.__get__('findEmailsFromUserIds')
//           let registeredIDs = []
//           private_func(registeredIDs).then(emails => {
//             emails.should.be.an('array')
//             emails.should.have.lengthOf(0)
//             done()
//           }).catch(err => {
//             done(new Error())
//           })
//         })
//
//       })
//
//     })
//   })
// })
//
