var express = require('express')
var router = express.Router()

const auth = require('../configs/auth')
const config = require('../configs/config')

/* GET home page. */
router.get('/', auth.checkAuth(["cn","id"],config.PERMISSIONS.student), function (req, res, next) {
  console.log(req.user)
  next({
    message: 'Unsupported get request.',
    status: 400
  })
})

module.exports = router
