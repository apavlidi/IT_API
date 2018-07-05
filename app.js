const express = require('express')
const logger = require('morgan')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const config = require('./configs/config')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const compression = require('compression')
const path = require('path')
const announcements = require('./routes/bulletinBoard/announcements/index').router
const announcementFiles = require('./routes/bulletinBoard/announcementFiles/index').router
const categories = require('./routes/bulletinBoard/categories/index').router
const apiFunctions = require('./routes/apiFunctions')
const log = require('./configs/logs').general
const ApplicationErrorClass = require('./routes/applicationErrorClass')

const index = require('./routes/index')
const fileUpload = require('express-fileupload')

const app = express()
// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(compression())   // Κανει compress ολα τα responses.Διαβασα οτι παντα πρεπει να γινεται compress στο response
app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static(path.join(__dirname, 'public')))
app.use(fileUpload())

app.all('/*', function (req, res, next) {
  // CORS headers
  res.header('Access-Control-Allow-Origin', '*') // restrict it to the required domain
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,PATCH,DELETE,OPTIONS')
  // Set custom headers for CORS
  res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token')
  if (req.method == 'OPTIONS') {
    res.status(200).end()
  } else {
    next()
  }
})

app.use('/', index)
app.use('/announcements', announcements)
app.use('/categories', categories)
app.use('/files', announcementFiles)
app.use(logErrors)

app.io = require('socket.io')()

app.io.on('connection', function (socket) {
  console.log('a user connected')

  socket.on('disconnect', function () {
    console.log('user disconnected')
  })
})

mongoose.Promise = global.Promise
mongoose.connect(config.MONGO[process.env.NODE_ENV], {
  connectTimeoutMS: 120000,
  socketTimeoutMS: 120000
})

app.use(session({
  secret: 'SDAsad7a844tcJm49glsdgagj4jrykg09sa4ak89treR5#Dsd',
  resave: false,
  saveUninitialized: true,
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
    ttl: 60 * 60 // = 1 hours.
  })
}))

//atch 404 and forward to error handler
app.use(function (req, res, next) {
  let err = new Error('Not Found')
  err.status = 404
  next(err)
})

function logErrors (err, req, res, next) {
  console.log(err)
  console.log('logging the error...')
  if (err instanceof ApplicationErrorClass) {
    apiFunctions.logging('error', err)
  }
  next(err)
}

// error handler
app.use(function (err, req, res, next) {
  console.log('EXPRESS ERROR HANDLING')
  console.log(err.constructor.name)
  if (err.constructor.name === 'ApplicationErrorClass') {
    err.headers = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress
    delete err.type
    console.log('hia')
    console.log(err)
  }
  // render the error page
  res.json({
    error: {
      type: err.type,
      code: err.code,
      message: err.text,
    }
  })
})

module.exports = app
