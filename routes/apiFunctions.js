const xss = require('xss')
const Joi = require('joi')
const ApplicationErrorClass = require('./applicationErrorClass')
const _ = require('lodash')

function formatQuery (req, res, next) {
  let query = req.query
  let selectedFields = null
  let formatedSelectedFields = null
  let formatedSort = [['date', 'descending']]
  let formatedPage = 0
  let formatedLimit = 0
  let formatedQ = {}

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
    let sortBy
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

  req.query = {
    filters: formatedQ,
    fields: formatedSelectedFields,
    sort: formatedSort,
    page: formatedPage,
    limit: formatedLimit
  }
  next()
}

function sanitizeInput (req, res, next) {
  if (!_.isEmpty(req.query)) {
    sanitizeObject(req.query)
  }
  if (!_.isEmpty(req.params)) {
    sanitizeObject(req.params)
  }
  if (!_.isEmpty(req.body)) {
    sanitizeObject(req.body)
  }
  next()
}

function sanitizeObject (obj) {
  Object.keys(obj).forEach(function (key) {
    if (typeof obj[key] === 'object') {
      return sanitizeObject(obj[key])
    }
    obj[key] = xss(obj[key], {
      whiteList: [],
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script']
    })
  })
}

function validateInput (objectToBeValidateStr, schema) {
  return function (req, res, next) {
    let objectToBeValidate = objectToBeValidateStr === 'params' ? req.params : req.body
    Joi.validate(objectToBeValidate, schema, function (err) {
      if (!err) {
        next()
      } else {
        next(new ApplicationErrorClass(null, null, 199, err, 'Σφάλμα κατα την εισαγωγή δεδομένων.', null, 500))
      }
    })
  }
}

function getClientIp (req) {
  return req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress
}

module.exports = {
  sanitizeInput,
  formatQuery,
  validateInput,
  getClientIp
}
