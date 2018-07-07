const xss = require('xss')
const Joi = require('joi')

function formatQuery (req, res, next) {
  let query = req.query
  let selectedFields = null
  let formatedSelectedFields = null
  let formatedSort = [['date', 'descending']]
  let formatedPage = 0
  let formatedLimit = 0
  let formatedQ = null

  if (Object.prototype.hasOwnProperty.call(query, 'q')) {
    formatedQ = JSON.parse(query.q)
    delete query.q
  }
  if (Object.prototype.hasOwnProperty.call(query, 'fields')) {
    selectedFields = query.fields
    delete query.fields
    formatedSelectedFields = selectedFields.split(',').join(' ')
  }
  if (Object.prototype.hasOwnProperty.call(query, 'page')) {
    formatedPage = query.page
    delete query.page
  }
  if (Object.prototype.hasOwnProperty.call(query, 'pageSize')) {
    formatedLimit = query.pageSize
    delete query.pageSize
  }
  if (Object.prototype.hasOwnProperty.call(query, 'sort')) {
    let sortBy;
    let sortDir = 'ascending'
    formatedSort = query.sort
    if (query.sort.charAt(0) === '-') {
      sortDir = 'descending'
      query.sort = query.sort.substr(1, query.sort.length)
    }
    sortBy = query.sort
    delete query.sort
    formatedSort = [[sortBy, sortDir]]
  }
  console.log('22')

  req.query = {
    filters: formatedQ,
    fields: formatedSelectedFields,
    sort: formatedSort,
    page: formatedPage,
    limit: formatedLimit
  }
  next()
}

function sanitizeObject (obj) {
  Object.keys(obj).forEach(function (key) {
    if (typeof obj[key] === 'object') {
      return sanitizeObject(obj[key])
    }
    obj[key] = xss(obj[key], {
      whiteList: [],        // empty, means filter out all tags
      stripIgnoreTag: true,      // filter out all HTML not in the whilelist
      stripIgnoreTagBody: ['script'] // the script tag is a special case, we need
      // to filter out its content
    })
  })
}

function validateInput (objectToBeValidateStr, schema) {
  return function (req, res, next) {
    let objectToBeValidate = objectToBeValidateStr === 'params' ? req.params : req.body
    sanitizeObject(objectToBeValidate)
    Joi.validate(objectToBeValidate, schema, function (err) {
      if (!err) {
        next()
      } else {
        console.log(err)
        res.status(500).json({message: 'Σφάλμα κατα την εισαγωγή δεδομένων'})
      }
    })
  }
}

function logging (typeOfLog, type, user, code, error, text, ip) {
  switch (typeOfLog) {
    case 'error':
      //   log.error(type, user, code, error, text, ip)
      break
    case 'info':
      //     log.info(type, user, code, error, text, ip)
      break
    default:
    //log.info(type, user, code, error, text, ip)
  }
}

function getClientIp (req) {
  return req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress
}

module.exports = {
  sanitizeObject,
  formatQuery,
  validateInput,
  logging,
  getClientIp
}