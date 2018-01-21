const server = require('./../bin/www') // 8eloume ton wwww file gia na dimiourgoume kai an klinoume enan server se ka8e test
const superagent = require('superagent') // gia http calls
const baseUrl = 'http://localhost:4001'
const should = require('chai').should() // gia testing

describe('api announcements', function () {
  let agent = superagent.agent()

  this.timeout(10000)

  before(function (done) {
    console.log('Testing server is listening on port 4000.\n')
    server.listen(4001, function (err) {
      done()
    })
  })

  after(function (done) {
    server.close()
    console.log('\nTesting server has closed.')
    done()
  })

  // it('should return all announcements at / when authorized', function (done) {
  //   agent.get(baseUrl + '/announcements').end(function (err, res) {
  //     res.body.should.be.a('array')
  //     res.should.have.property('status', 200)
  //     done()
  //   })
  // })
  //
  // it('should return public announcements at / when not authorized', function (done) {
  //   agent.get(baseUrl + '/announcements/').end(function (err, res) {
  //     res.should.have.property('status', 200)
  //     done()
  //   })
  // })
})
