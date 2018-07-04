var express = require('express')
var router = express.Router()
const ApplicationErrorClass = require('./applicationErrorClass')
const apiFunctions = require('./apiFunctions')

const auth = require('../configs/auth')
const config = require('../configs/config')

/* GET home page. */
router.get('/', auth.checkAuth(['cn', 'id'], config.PERMISSIONS.student, true), function (req, res, next) {
  if (req.user) {
    next({
      message: 'User OK.',
      status: 200
    })
  }
  else {
    next({
      message: 'Public Call.',
      status: 200
    })
  }
})

router.get('/error', function (req, res, next) {
  return next(new ApplicationErrorClass('getError', 'unknown', 100, 'real error', 'Σφάλμα κατα την ενέργεια σας', apiFunctions.getClientIp(req), 400, true))
})

router.get('/log', function (req, res, next) {
  apiFunctions.logging('info', 'getError', 'unknown', 100, 'real error', 'Σφάλμα κατα την ενέργεια σας', apiFunctions.getClientIp(req))
})

module.exports = router
