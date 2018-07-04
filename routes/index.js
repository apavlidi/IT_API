var express = require('express')
var router = express.Router()

const auth = require('../configs/auth')
const config = require('../configs/config')

/* GET home page. */
router.get('/', auth.checkAuth(["cn","id"],config.PERMISSIONS.student,true), function (req, res, next) {
  console.log(req.user)
  if(req.user){
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

module.exports = router
