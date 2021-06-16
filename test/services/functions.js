let rewire = require('rewire'),
  functionsPrivate = rewire('./../../routes/services/functions')
let functionsPublic = require('./../../routes/services/functions')
const config = require('../../configs/config')

describe('categories', () => {

  let ldapMain = config.LDAP_CLIENT
  ldapUserToken = 'access_token=eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTA2Iiwic2NvcGUiOlsiYW5ub3VuY2VtZW50cyIsImVkaXRfYW5ub3VuY2VtZW50cyIsImxkYXAiLCJub3RpZmljYXRpb25zIiwiZWRpdF9ub3RpZmljYXRpb25zIiwic2VydmljZXMiLCJlZGl0X3NlcnZpY2VzIiwicHJvZmlsZSIsImVkaXRfcHJvZmlsZSIsIm5vdHkiLCJlZGl0X25vdHkiLCJlZGl0X3Bhc3N3b3JkIiwiZWRpdF9tYWlsIl0sImhhc2giOiIyMmNuOXM2bG9qZGZ0cmE5bzJkbSIsImlhdCI6MTUzMDYyODg5NiwiZXhwIjozNTMwOTI5MDE2LCJhdWQiOlsiNTlhOTlkNTk4OWVmNjQ2NTc3ODA4NzljIl19.Tg2uHcD9CdXkXlQ_6uF2Z7nm2BXHaBvHRcgOobPLdK2dlkGxuMER1lSYNrCIWzRLgNu7905gn8x88ChnCs-MGoC8Az9gvdj52Gm7SapDVYU1DIx_a7-Olm3-bRKMTO-YOMGsYlh_uKToTwypi_5HZUL81_SaxYVkO6cYrz7pTzEhP6BMQwP4Du3JxyMsqNQ5i_jipcrkXwHd0fcA88eKAbVIBfUE90lsDgfa5tC2KICGUsEhU594v60bUqNfSHVbPEg-cvYRtlD_zKfUkvRWsyRqocguWqetWQrsKBN66MFuFEVqk4bpyRFlRocDyWyslUA0KBexWyp9EZlu0hdNamwj-ypu8Fa08Fd2IVK4ycaRu1h-z5ggVHLRvbtTf-4Ll-hXOH9P341COjyXxFYdz8OjMRfpmG9m0K8qYPSRtFL5s6-vZ6hyDO9cZqWGzxE_FV6oj3ujTgC01zlAheqM2-voNyl6d7lcoDJRlRNkdRymCXbYON0me44BDkoGxn4udZ4JjdzUw40tb7l6HPcdzbyM2vVay9kHouoZ-HSRWgW-m4f5iyu-7j5hLI9IRWOl_4qI9GgcgQJjPovetaauWKOmL_WpNg8_92RDi6O6r28xLQV6dXalvyyAcu3dPjmRGCkkz0Yal9maJKR4Um80qqe7SU6hwxDED00JtEzEaAI'
  let user = {
    dn: 'uid=unitTesting,ou=student,ou=people,dc=it,dc=teithe,dc=gr'
  }

  before(function (done) {

    ldapMain.bind(config.LDAP[process.env.NODE_ENV].user, config.LDAP[process.env.NODE_ENV].password, function (err) {
      if (err) {
        done(new Error())
      } else {
        done()
      }
    })

  })

  after(function (done) {
    ldapMain.unbind((err) => {
      if (err) {
        done(new Error())
      } else {
        done()
      }
    })
  })

  context('routes', () => {

    context('getServiceStatus', () => {

      it('should return 200 when everything is ok', (done) => {
        chai.request(server)
          .get('/services?' + ldapUserToken)
          .end((err, res) => {
            res.should.have.status(200)
            done()
          })
      })

      it('should return 400 when token doesn`t exist', (done) => {
        chai.request(server)
          .get('/services')
          .end((err, res) => {
            res.should.have.status(400)
            done()
          })
      })

    })

    context('sshChangeStatusUsers', () => {

      it('should return 200 when everything is ok', (done) => {
        chai.request(server)
          .patch('/services/ssh/users?' + ldapUserToken)
          .end((err, res) => {
            res.should.have.status(200)
            done()
          })
      })

      it('should return 400 when token doesn`t exist', (done) => {
        chai.request(server)
          .patch('/services/ssh/users')
          .end((err, res) => {
            res.should.have.status(400)
            done()
          })
      })

    })

    context('sshChangeStatusAetos', () => {

      it('should return 200 when everything is ok', (done) => {
        chai.request(server)
          .patch('/services/ssh/aetos?' + ldapUserToken)
          .end((err, res) => {
            res.should.have.status(200)
            done()
          })
      })

      it('should return 400 when token doesn`t exist', (done) => {
        chai.request(server)
          .patch('/services/ssh/aetos')
          .end((err, res) => {
            res.should.have.status(400)
            done()
          })
      })

    })

  })

  context('functions', () => {

    context.skip('enableSshFromVm', () => {

      it('should enable ssh from vm for user', (done) => {
        functionsPublic.enableSshFromVm(ldapMain, user, 'users').then(() => {
          done()
        }).catch(err => {
          done(new Error(err))
        })
      })

      it('should enable ssh from vm for aetos', (done) => {
        functionsPublic.enableSshFromVm(ldapMain, user, 'aetos').then(() => {
          done()
        }).catch(err => {
          done(new Error(err))
        })
      })

    })

    context.skip('disableSshFromVM', () => {

      it('should disable ssh from vm for user', (done) => {
        functionsPublic.disableSshFromVM(ldapMain, user, 'users').then(() => {
          done()
        }).catch(err => {
          done(new Error(err))
        })
      })

      it('should disable ssh from vm for aetos', (done) => {
        functionsPublic.disableSshFromVM(ldapMain, user, 'aetos').then(() => {
          done()
        }).catch(err => {
          done(new Error(err))
        })
      })

    })

  })

})