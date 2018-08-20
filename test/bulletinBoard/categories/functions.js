const functionsSetup = require('../setupDB')

let rewire = require('rewire'),
  functionsPrivate = rewire('./../../../routes/bulletinBoard/categories/functions')
let functionsPublic = require('./../../../routes/bulletinBoard/categories/functions')

describe('categories', () => {
  let categoryIDPrivateExample
  let categoryIDPublicExample

  before(function (done) {
    functionsSetup.removeAllCollections().then(() => {
      return functionsSetup.createCategoryPublicExample()
    }).then(categoryIDPublicExampleReturned => {
      categoryIDPublicExample = categoryIDPublicExampleReturned
      return functionsSetup.createCategoryPrivateExample()
    }).then(categoryIDPrivateExampleReturned => {
      categoryIDPrivateExample = categoryIDPrivateExampleReturned
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

    context('getAnnouncementsCategories', () => {

      it('it should return all categories when authorized', (done) => {
        chai.request(server)
          .get('/categories?' + access_token)
          .end((err, res) => {
            let body = res.body
            body.should.be.an('array')
            res.should.have.status(200)
            done()
          })
      })

      it('it should return 400 code when NOT authorized', (done) => {
        chai.request(server)
          .get('/categories')
          .end((err, res) => {
            res.should.have.status(400)
            done()
          })
      })

    })

    context('getAnnouncementsCategoriesPublic', () => {

      it('it should return public categories when authorized', (done) => {
        chai.request(server)
          .get('/categories/public?' + access_token)
          .end((err, res) => {
            let body = res.body
            body.should.be.an('array')
            res.should.have.status(200)
            done()
          })
      })

      it('it should public categories NOT authorized', (done) => {
        chai.request(server)
          .get('/categories/pubLIC')
          .end((err, res) => {
            let body = res.body
            body.should.be.an('array')
            res.should.have.status(200)
            done()
          })
      })
    })

    context('getIsRegisteredToCategories', () => {

      it('it should return registration to categories when authorized', (done) => {
        chai.request(server)
          .get('/categories/isRegistered?' + access_token)
          .end((err, res) => {
            let body = res.body
            body.should.be.an('array')
            res.should.have.status(200)
            done()
          })
      })

      it('it should return 400 code when NOT authorized', (done) => {
        chai.request(server)
          .get('/categories/isRegistered')
          .end((err, res) => {
            res.should.have.status(400)
            done()
          })
      })
    })

  })

  context('functions', () => {

    context('parseArraysInput', () => {

      it('it should return an arrayParsed when array passed is valid', (done) => {
        let array = JSON.stringify(['123456', '7890'])
        let privateFunc = functionsPrivate.__get__('parseArraysInput')
        privateFunc(array).then(arrayParsed => {
          done()
        }).catch(applicationError => {
          done(new Error())
        })
      })

      it('it should return an error when array passed is NOT valid', (done) => {
        let arrayNotValid = ['123456', '7890']
        let privateFunc = functionsPrivate.__get__('parseArraysInput')
        privateFunc(arrayNotValid).then(arrayParsed => {
          done(new Error())
        }).catch(applicationError => {
          applicationError.should.have.property('code')
          let code = applicationError.code
          code.should.equal(1242)
          done()
        })
      })

    })

    context('updateDatabaseRegistration', () => {

      it('it should register the userID to the categories', (done) => {
        let categories = [categoryIDPublicExample]
        let userID = 5106
        let action = '$addToSet'
        let privateFunc = functionsPrivate.__get__('updateDatabaseRegistration')
        privateFunc(categories, userID, action).then(() => {
          done()
        }).catch(applicationError => {
          done(new Error())
        })
      })

      it('it should remove the registration of the userID of the categories', (done) => {
        let categories = [categoryIDPublicExample]
        let userID = 5106
        let action = '$pull'
        let privateFunc = functionsPrivate.__get__('updateDatabaseRegistration')
        privateFunc(categories, userID, action).then(() => {
          done()
        }).catch(applicationError => {
          done(new Error())
        })
      })

    })

    context('updateRegistrationToCategories', () => {

      it('it should register the userID to the categories', (done) => {
        let categories = JSON.stringify([categoryIDPublicExample])
        let userID = 5106
        let action = '$addToSet'
        functionsPublic.updateRegistrationToCategories(categories, userID, action).then(() => {
          done()
        }).catch(applicationError => {
          done(new Error())
        })
      })

      it('it should remove the registration of the userID of the categories', (done) => {
        let categories = JSON.stringify([categoryIDPublicExample])
        let userID = 5106
        let action = '$pull'
        functionsPublic.updateRegistrationToCategories(categories, userID, action).then(() => {
          done()
        }).catch(applicationError => {
          done(new Error())
        })
      })

      it('it should throw an error when array is not valid', (done) => {
        let categoriesNotValid = [categoryIDPublicExample]
        let userID = 5106
        let action = '$pull'
        functionsPublic.updateRegistrationToCategories(categoriesNotValid, userID, action).then(() => {
          done(new Error())
        }).catch(applicationError => {
          applicationError.should.have.property('code')
          let code = applicationError.code
          code.should.equal(1242)
          done()
        })
      })

    })

  })

})