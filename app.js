const express = require('express')
const logger = require('morgan')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const compression = require('compression')
const path = require('path')
const fileUpload = require('express-fileupload')
const helmet = require('helmet')
const app = express()

const announcements = require('./routes/bulletinBoard/announcements/index').router
const announcementFiles = require('./routes/bulletinBoard/announcementFiles/index').router
const categories = require('./routes/bulletinBoard/categories/index').router
const notifications = require('./routes/notifications/index').router
const index = require('./routes/index')
const reg = require('./routes/user/reg/index').router
const user = require('./routes/user/user/index').router
const profile = require('./routes/user/profile/index').router
const noty = require('./routes/user/profileNoty/index').router
const usersAdmin = require('./routes/ldap/usersAdmin/index').router
const ldapGroups = require('./routes/ldap/groups/index').router
const accountTypes = require('./routes/ldap/accountType/index').router
const configs = require('./routes/ldap/config/index').router
const userAdmin = require('./routes/ldap/userAdmin/index').router
const services = require('./routes/services/index').router

const config = require('./configs/config')
const apiFunctions = require('./routes/apiFunctions')

// Μπαίνει ψηλά το helmet ώστε να γίνεται η προστασία απο την αρχή
app.use(helmet()) // Default
app.use(helmet.referrerPolicy({ policy: 'no-referrer-when-downgrade' }))
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'none'"]
  }
}))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(compression()) // Κανει compress ολα τα responses.Διαβασα οτι παντα πρεπει να γινεται compress στο response
app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static(path.join(__dirname, 'public')))
app.use(fileUpload())

app.all('/*', apiFunctions.sanitizeInput, function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,PATCH,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token')
  if (req.method === 'OPTIONS') {
    res.status(200).end()
  } else {
    next()
  }
})

app.use('/', index)
app.use('/announcements', announcements)
app.use('/categories', categories)
app.use('/files', announcementFiles)
app.use('/notifications', notifications)
app.use('/reg', reg)
app.use('/user', user)
app.use('/profile', profile)
app.use('/noty', noty)
app.use('/usersAdmin', usersAdmin)
app.use('/groups', ldapGroups)
app.use('/accountTypes', accountTypes)
app.use('/configs', configs)
app.use('/userAdmin', userAdmin)
app.use('/services', services)

app.io = require('socket.io')()

app.io.on('connection', function (socket) {
  console.log('a user connected')

  socket.on('disconnect', function () {
    console.log('user disconnected')
  })
})

mongoose.connect(config.MONGO[process.env.NODE_ENV], {
  connectTimeoutMS: 120000,
  socketTimeoutMS: 120000
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  let err = {
    message: 'Ο σύνδεσμος δεν βρέθηκε',
    type: 'WrongEndPointError',
    code: '9000'
  }
  next(err)
})

// error handler
app.use(function (err, req, res, next) {
  if (err.text) {
    res.status(err.httpCode).json({
      error: {
        message: err.text,
        type: err.type,
        code: err.code
      }
    })
  } else if (err.code === '9000') {
    res.status(404).json(err)
  } else {
    res.status(500).json({
      error: {
        message: 'Συνέβη κάποιο σφάλμα.',
        type: 'WrongEndPointError',
        code: '2000'
      }
    })
  }
})

module.exports = app
