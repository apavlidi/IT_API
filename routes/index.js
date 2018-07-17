var express = require('express')
var router = express.Router()
const ApplicationErrorClass = require('./applicationErrorClass')
const apiFunctions = require('./apiFunctions')

const auth = require('../configs/auth')
const config = require('../configs/config')

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('indexNots')
})

module.exports = router
