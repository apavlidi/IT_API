// let rewire = require('rewire'),
//   functionsPrivate = rewire('./../../routes/notifications/functions')
// let functionsPublic = require('./../../routes/notifications/functions')
//
// let publisher = {
//   id: '5106',
//   name: 'alexis'
// }
//
// describe('categories', () => {
//   let categoryIDPublicExample = '59ab445c3eb44c2c608cb18b'
//   let announcementPublicIDExample = '5b7003ef8ff1ef0727fa5655'
//   let notificationIDExample = '5b6ffd9b8ff1ef0727fa564a'
//
//   before(function (done) {
//     this.timeout(10000)
//     fixtures
//       .connect('mongodb://admin:Password@192.168.6.94/myapptest')
//       .then(() => fixtures.unload())
//       .then(() => fixtures.load())
//       .then(function () {
//         done()
//       }).catch(e => function () {
//       done(new Error('Fixtures error'))
//     })
//   })
//
//   after(function (done) {
//     this.timeout(10000)
//     fixtures
//       .connect('mongodb://admin:Password@192.168.6.94/myapptest')
//       .then(() => fixtures.disconnect())
//       .then(function () {
//         done()
//       }).catch(e => function () {
//       done(new Error('Fixtures error'))
//     })
//   })
//
//   context('routes', () => {
//
//     context('getNotificationsUser', () => {
//
//       it('it should return notifications of profile when authenticated', (done) => {
//         chai.request(server)
//           .get('/notifications?' + access_token)
//           .end((err, res) => {
//             res.should.have.status(200)
//             done()
//           })
//       })
//
//       it('it should return error when NOT authenticated', (done) => {
//         chai.request(server)
//           .get('/notifications')
//           .end((err, res) => {
//             res.should.have.status(400)
//             done()
//           })
//       })
//     })
//
//     context('readNotificationsUser', () => {
//
//       it('it should return a 200 when reading notifications when authenticated', (done) => {
//         chai.request(server)
//           .post('/notifications?' + access_token)
//           .end((err, res) => {
//             res.should.have.status(200)
//             done()
//           })
//       })
//
//       it('it should return error when NOT authenticated', (done) => {
//         chai.request(server)
//           .post('/notifications')
//           .end((err, res) => {
//             res.should.have.status(400)
//             done()
//           })
//       })
//     })
//
//   })
//
//   context('functions', () => {
//
//     it('it should create a new Notification', (done) => {
//       functionsPublic.createNotification(announcementPublicIDExample, publisher).then(newNotification => {
//         newNotification.should.be.an('object')
//         newNotification.should.have.a.property('related')
//         let related = newNotification.related
//         related.should.have.a.property('id')
//         let relatedID = related.id
//         relatedID.should.equals(announcementPublicIDExample)
//         done()
//       }).catch(err => {
//         done(new Error(err))
//       })
//     })
//
//     it('it should save a notification to a profile', (done) => {
//       let announcementEntry = database.Announcements({
//         publisher: {name: 'alexandros pavlidis', id: '5106'}, title: 'test',
//         text: 'text', textEn: 'test', titleEn: 'test', '_about': categoryIDPublicExample,
//       })
//
//       functionsPublic.sendNotifications(announcementEntry, notificationIDExample, publisher.id).then(() => {
//         done()
//       }).catch(err => {
//         done(new Error(err))
//       })
//     })
//
//     it('it should return error when category doesn`t exist', (done) => {
//       let announcementEntry = database.Announcements({
//         publisher: {name: 'alexandros pavlidis', id: '5106'}, title: 'test',
//         text: 'text', textEn: 'test', titleEn: 'test', '_about': mongoose.Types.ObjectId(),
//       })
//
//       functionsPublic.sendNotifications(announcementEntry, notificationIDExample, publisher.id).then(() => {
//         done(new Error())
//       }).catch(err => {
//         err.should.have.a.property('code')
//         let code = err.code
//         code.should.equals(999)
//         done()
//       })
//     })
//
//   })
//
// })