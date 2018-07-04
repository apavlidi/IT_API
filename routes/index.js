var express = require('express')
var router = express.Router()
const ApplicationErrorClass = require('./applicationErrorClass')

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
  return next(new ApplicationErrorClass('αυτο ειναι ενα κειμενο για τον server', 'αυτο ειναι κείμενο για τον χρηστη'))
})

module.exports = router
