// context('createNotification', () => {
//
//   it('should return a new Notification', (done) => {
//     let announcementID = mongoose.Types.ObjectId()
//     let publisher = {nameEn: 'Alexis', id: '12345', nameEl: 'Αλεξης'}
//     functionsPublic.createNotification(announcementID, publisher).then((result) => {
//       result.should.be.an('object')
//       result.should.have.a.property('related')
//       result.should.have.a.property('userId')
//       done()
//     })
//   })
//
//   it('should return an error when passing invalid ID', (done) => {
//     let announcementID = 'Invalid ID'
//     let publisher = {nameEn: 'Alexis', id: '12345', nameEl: 'Αλεξης'}
//     functionsPublic.createNotification(announcementID, publisher).then((result) => {
//       done(new Error())
//     }).catch((err) => {
//       done()
//     })
//   })
//
//   it('should return an error when save fails', (done) => {
//     let announcementID = mongoose.Types.ObjectId()
//     Object.defineProperty(database.Notification.prototype, 'save', {
//       value: database.Notification.prototype.save,
//       configurable: true,
//     })
//
//     const NotificationMocked = sinon.mock(database.Notification.prototype)
//     NotificationMocked.expects('save').yields(new Error())
//
//     let publisher = {nameEn: 'Alexis', id: '12345', nameEl: 'Αλεξης', invalid: 'Fake data'}
//     functionsPublic.createNotification(announcementID, publisher).then((result) => {
//       database.Notification.prototype.save.restore()
//       done(new Error())
//     }).catch((err) => {
//       database.Notification.prototype.save.restore()
//       done()
//     })
//   })
//
// })