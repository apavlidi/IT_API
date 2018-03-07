var express = require('express')
var router = express.Router()

const auth = require('../configs/auth')

/* GET home page. */
router.get('/', auth.checkAuth(false), function (req, res, next) {
  next({
    message: 'Unsupported get request.',
    status: 400
  })
})

module.exports = router
