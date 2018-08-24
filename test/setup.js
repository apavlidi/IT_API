process.env.NODE_ENV = 'test'

const database = require('../configs/database')
const mongoose = require('mongoose')
global.database = database
global.mongoose = mongoose

const server = require('../app')
global.server = server

const chai = require('chai')
const chaiHttp = require('chai-http')
const expect = chai.expect
const should = chai.should()
const sinon = require('sinon')
require('sinon-mongoose')
const access_token = 'access_token=eyJhbGciOiJSUzUxMiJ9.eyJ1c2VySWQiOiI1MTA2Iiwic2NvcGUiOlsiYW5ub3VuY2VtZW50cyIsImxkYXAiLCJub3RpZmljYXRpb25zIiwic2VydmljZXMiLCJ1c2VyIl0sImhhc2giOiIyMmNuOXM2bG9qZGZ0cmE5bzJkbSIsImlhdCI6MTUzMDYyODg5NiwiZXhwIjozNTMwOTI5MDE2LCJhdWQiOlsiNTlhOTlkNTk4OWVmNjQ2NTc3ODA4NzljIl19.OB4vqn8FYTvdS60owKoH2aFRwrP3Q1uo4A3k2W1M1n20eknDuLC7lpf6UBtBpQziBPDK9lk_sUTjh1Ofsn9P9nZ4nYS0s3r4vck11tqZ8O0ooVwLi9PsNwnzs4gVHtlkfIHy63NtOBQIgxqXCefpZYat8c65NVY4BdQUlLeEuxj1TKhzYoH8f52r0Yzn4fO5rWWSvXxCi0zE6_jmlDIQtiCXi73uaKaVaIMv13rLg9mTim3ajk5yBX2rrWOasxQMeu2IaAJEkVpsM2xOUFSwRERPh36luBF1FSuJ0DaIlvrCsCQ6GZL4NOmLHVUGPyo0YwuVv0T3utCUkExeH7rkGspBNvK88YTMcMVH0U0n2Zra0qySkgwZQcmZMKQg9ORcBEHFXcFbZehZLuSE89SnFenSdhbvCiNQ9oH4z2dnAOAqlCefacgnAcA3sqp0fghWVwVqDmEPWmf1WiIhZuriLDXqytLPFh78VwBpZCiZb1aVhY6eEHcSU4yBigEAi1fWAB_1ZTKZOCflWa-K5oMipoXU7r2tlARzdnS7QdLc3D1Fd8wxRmnXlSj-_eMeBO02NOcmg7fR799FVZ-obpZ8e6QM8TF2K9zavXdX8kfjqtGQiostKF2ex2jbyoZBfoFecowKuDTYtVrbSBntrYAajZOxhoDLLB2-9jdBtCJ_4ps'
chai.use(chaiHttp)
global.chai = chai
global.should = should
global.expect = expect
global.sinon = sinon
global.access_token = access_token

const Fixtures = require('node-mongodb-fixtures')
const fixtures = new Fixtures({
  dir: './fixtures',
  mute: false, // do not mute the log output
})
global.fixtures = fixtures