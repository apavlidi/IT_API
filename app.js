const express = require('express')
const logger = require('morgan')
const bodyParser = require('body-parser')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const mongoose = require('mongoose')
const config = require('./configs/config')
const apiFunctions = require('./routes/apiFunctions')
const ApplicationErrorClass = require('./routes/applicationErrorClass')

const index = require('./routes/index')
const apiNotifications = require('./routes/notifications');

const app = express()

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

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
app.use('/notifications', apiNotifications);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handler
app.use(function (err, req, res, next) {
  console.log('EXPRESS ERROR HANDLING')
  console.log('εδώ εμφανίζουμε οτι θέλουμε στον τελικό χρήστη απο το object')
  // set locals, only providing error in development
  // res.locals.message = err.message
  // res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  if (err.text) {
    res.json({
      error: {
        message: err.text,
        type: err.type,
        code: err.code,
      }
    })
  } else {
    res.json({
      error: {
        message: 'Συνέβη κάποιο σφάλμα.',
        type: 'WrongEndPointError',
        code: '2000',
    }
    })
  }
})

module.exports = app
