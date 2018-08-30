describe('announcements', () => {

  context('404 error', () => {

    it('it should return a 404 error object on invalid url', (done) => {
      chai.request(server)
        .get('/INVALID')
        .end((err, res) => {
          res.should.have.status(404)
          res.body.should.be.an('object')
          done()
        })
    })

    it('it should return a 404 error with correct properties on invalid url', (done) => {
      chai.request(server)
        .get('/INVALID')
        .end((err, res) => {
          res.should.have.status(404)
          res.body.should.be.an('object')
          let errorObj = res.body
          errorObj.should.have.property('message')
          errorObj.should.have.property('type')
          errorObj.should.have.property('code')
          done()
        })

    })
  })

  context('OPTIONS Method', () => {

    it('it should return a 200 code when hitting with options method', (done) => {
      chai.request(server)
        .options('/*')
        .end((err, res) => {
          res.should.have.status(200)
          done()
        })
    })

    it('it should return a 404 code when hitting with invalid method', (done) => {
      chai.request(server)
        .trace('/*')
        .end((err, res) => {
          res.should.have.status(404)
          done()
        })
    })

  })

})