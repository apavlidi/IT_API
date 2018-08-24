// let rewire = require('rewire'),
//   functionsPrivate = rewire('./../../routes/services/functions')
// let functionsPublic = require('./../../routes/services/functions')
// const config = require('../../configs/config')
//
// describe('categories', () => {
//
//   let ldapMain = config.LDAP_CLIENT
//   ldapUserToken = 'access_token=eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5OTk5Iiwic2NvcGUiOlsiaWQiLCJjbiIsInVpZCIsImVkdVBlcnNvblNjb3BlZEFmZmlsaWF0aW9uIl0sImhhc2giOiIyMmNuOXM2bG9qZGZ0cmE5bzJkbSIsImlhdCI6MTUzMDYyODg5NiwiZXhwIjozNTMwOTI5MDE2LCJhdWQiOlsiNTlhOTlkNTk4OWVmNjQ2NTc3ODA4NzljIl19.FpijTsh0dlttf7z0uCRyvisGUm5iRmw3pDApXHNMRVYPV_2lFc3OelH4CWLiE8Ljrcx1B_3c6ff7bvOC-nxkF8WNqlcV3OhFIWIYnrJzTJu5xC66Gt1yPnmbRgCYkYxt1lvfoIP3O1ZKzw9XCYdfSSw-8aFNKDlvQvDyw3uJNkVy09WWMrMTe59CGd-Nrg58SrBzjuHF3OmnhzKcrrRr8vDUSDqqGfNJNrAqG8SlT0Nvt-LFkxZOwnN5gBNpirLriI9luf8_JOV54H_u9UhNYdNKaZfnRgavdrMO_k2_LZS2Oo1obBtFXtg9jZD-_w4PtMw29Q1bAqw88YKKxIMqLPIGTZ846sNFZ1t4WX7EYEb6SHZv77k-ND2WXlSgNL_I8-_FB8UX-0myfZktW9nQ97fqMEA8SnyD_v2dvZSQTJ2eIVSyb7QDOin2OoZ8y8Xu-t2DWUZ14zihuMkszHyBCWMUB6W9RGsxQfXhZm9yDHNe5TFDMx-UpyhVX4JUZADMimnbW1_HPxfwdGusKXGGv_3_Bt1obsoBR6D2MgOr83RfO_CX7TwhJq4Z_LuHYJi6EYENcsaGpM6qNfqi8ciT7mhWXAFQCwrwqlczqZODAfTvu1_ZyQOMj54mWHTJpuE7iFu9tNq3-rj0SJ2ixSKHIFwy_vd2vNB7pHEqVb8pNo0'
//   let user = {
//     dn: 'uid=unitTesting,ou=student,ou=people,dc=it,dc=teithe,dc=gr'
//   }
//
//   before(function (done) {
//
//     ldapMain.bind(config.LDAP[process.env.NODE_ENV].user, config.LDAP[process.env.NODE_ENV].password, function (err) {
//       if (err) {
//         done(new Error())
//       } else {
//         done()
//       }
//     })
//
//   })
//
//   after(function (done) {
//     ldapMain.unbind((err) => {
//       if (err) {
//         done(new Error())
//       } else {
//         done()
//       }
//     })
//   })
//
//   context('routes', () => {
//
//     context('getServiceStatus', () => {
//
//       it('should return 200 when everything is ok', (done) => {
//         chai.request(server)
//           .get('/services?' + ldapUserToken)
//           .end((err, res) => {
//             res.should.have.status(200)
//             done()
//           })
//       })
//
//       it('should return 400 when token doesn`t exist', (done) => {
//         chai.request(server)
//           .get('/services')
//           .end((err, res) => {
//             res.should.have.status(400)
//             done()
//           })
//       })
//
//     })
//
//     context('sshChangeStatusUsers', () => {
//
//       it('should return 200 when everything is ok', (done) => {
//         chai.request(server)
//           .patch('/services/ssh/users?' + ldapUserToken)
//           .end((err, res) => {
//             res.should.have.status(200)
//             done()
//           })
//       })
//
//       it('should return 400 when token doesn`t exist', (done) => {
//         chai.request(server)
//           .patch('/services/ssh/users')
//           .end((err, res) => {
//             res.should.have.status(400)
//             done()
//           })
//       })
//
//     })
//
//     context('sshChangeStatusAetos', () => {
//
//       it('should return 200 when everything is ok', (done) => {
//         chai.request(server)
//           .patch('/services/ssh/aetos?' + ldapUserToken)
//           .end((err, res) => {
//             res.should.have.status(200)
//             done()
//           })
//       })
//
//       it('should return 400 when token doesn`t exist', (done) => {
//         chai.request(server)
//           .patch('/services/ssh/aetos')
//           .end((err, res) => {
//             res.should.have.status(400)
//             done()
//           })
//       })
//
//     })
//
//   })
//
//   context('functions', () => {
//
//     context.skip('enableSshFromVm', () => {
//
//       it('should enable ssh from vm for user', (done) => {
//         functionsPublic.enableSshFromVm(ldapMain, user, 'users').then(() => {
//           done()
//         }).catch(err => {
//           done(new Error(err))
//         })
//       })
//
//       it('should enable ssh from vm for aetos', (done) => {
//         functionsPublic.enableSshFromVm(ldapMain, user, 'aetos').then(() => {
//           done()
//         }).catch(err => {
//           done(new Error(err))
//         })
//       })
//
//     })
//
//     context.skip('disableSshFromVM', () => {
//
//       it('should disable ssh from vm for user', (done) => {
//         functionsPublic.disableSshFromVM(ldapMain, user, 'users').then(() => {
//           done()
//         }).catch(err => {
//           done(new Error(err))
//         })
//       })
//
//       it('should disable ssh from vm for aetos', (done) => {
//         functionsPublic.disableSshFromVM(ldapMain, user, 'aetos').then(() => {
//           done()
//         }).catch(err => {
//           done(new Error(err))
//         })
//       })
//
//     })
//
//   })
//
// })