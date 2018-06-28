var express = require('express')
var router = express.Router()

const auth = require('../configs/auth')

/* GET home page. */
router.get('/', auth.checkAuth(true,["cn","id"],1,false), function (req, res, next) {
  console.log(req.user)
  next({
    message: 'Unsupported get request.',
    status: 400
  })
})

module.exports = router
