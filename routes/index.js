var express = require('express')
var router = express.Router()

const auth = require('../configs/auth')
const config = require('../configs/config')

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index')
})

module.exports = router
