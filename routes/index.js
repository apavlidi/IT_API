var express = require('express')
var router = express.Router()
const ApplicationErrorClass = require('./applicationErrorClass')
const apiFunctions = require('./apiFunctions')

const auth = require('../configs/auth')
const config = require('../configs/config')

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index')
})

router.get('/error', function (req, res, next) {
  return next(new ApplicationErrorClass('getError', 'unknown', 100, 'real error', 'Σφάλμα κατα την ενέργεια σας', apiFunctions.getClientIp(req), 400, true))
})

router.get('/log', function (req, res, next) {
  apiFunctions.logging('info', 'getError', 'unknown', 100, 'real error', 'Σφάλμα κατα την ενέργεια σας', apiFunctions.getClientIp(req))
})

module.exports = router
