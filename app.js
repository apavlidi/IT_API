const express = require('express')
const logger = require('morgan')
const bodyParser = require('body-parser')
const apiFunctions = require('./routes/apiFunctions')
const ApplicationErrorClass = require('./routes/applicationErrorClass')

const index = require('./routes/index')

const app = express()

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))


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
app.use(logErrors)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

function logErrors (err, req, res, next) {
  console.log('logging the error...')
  if (err instanceof ApplicationErrorClass) {
    console.log('Εδω κανουμε Log οτι θέλουμε μεσα απο το object')
    console.log(err.textForServer)
    apiFunctions.logging('error', err)
  }
  next(err)
}

// error handler
app.use(function (err, req, res, next) {
  console.log('EXPRESS ERROR HANDLING')
  console.log('εδώ εμφανίζουμε οτι θέλουμε στον τελικό χρήστη απο το object')
  // set locals, only providing error in development
  // res.locals.message = err.message
  // res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.json(err.textForClient)
})

module.exports = app
