const crypt = require('crypt3/sync')
const crypto = require('crypto')
const filter = require('ldap-filters')
const _ = require('lodash')

const functionsUser = require('../functionsUser')
const mailTexts = require('./../../../configs/mailText')
const config = require('../../../configs/config')
const database = require('../../../configs/database')
const PromiseError = require('../../promiseErrorClass')
const ApplicationError = require('../../applicationErrorClass')

const INTEGER_FIELDS = require('./../../../configs/ldap').INTEGER_FIELDS

function deleteResetToken (token) {
  return new Promise(
    function (resolve, reject) {
      database.UserPassReset.findOneAndRemove({token: token}).exec(function (err) {
        if (err) {
          reject(new PromiseError(2232, err))
        } else {
          resolve()
        }
      })
    })
}

function passwordsAreDifferent (password1, password2) {
  return password1 !== password2
}

function passwordsAreSame (password1, password2) {
  return !passwordsAreDifferent(password1, password2)
}

function newPasswordExistsInHistory (user, password) {
  let passwordExistsInHistory = false
  if (!(user.pwdHistory instanceof Array)) { // make it function
    let tmphis = user.pwdHistory
    user.pwdHistory = []
    user.pwdHistory.push(tmphis)
  }

  user.pwdHistory.forEach(function (pwd) {
    try {
      let oldSaltFinal = pwd.match(/\$.\$.+\$/g)[0].slice(0, -1)
      let hash = crypt(password, oldSaltFinal)
      if ('{CRYPT}' + hash === pwd.split('#')[3]) {
        passwordExistsInHistory = true
      }
    } catch (err) {
      return false
    }
  })
  return passwordExistsInHistory
}

function oldPassIsCorrect (user, oldPassword) {
  let oldPassVerifies = false
  try {
    let currentSalt = user.userPassword.match(/\$.\$.+\$/g)[0].slice(0, -1)
    let currentHash = crypt(oldPassword, currentSalt)
    if ('{CRYPT}' + currentHash === user.userPassword) { oldPassVerifies = true }
  } catch (err) {
    return false
  }
  return oldPassVerifies
}

function sendEmailToken (mailToken) {
  return new Promise(
    function (resolve, reject) {
      config.MAIL.sendMail(mailToken, (err, info) => {
        if (err) {
          reject(new PromiseError(2223, err))
        } else {
          resolve()
        }
      })
    })
}

function buildEmailToken (user, token, action) {
  let bodyText
  let subject
  let from

  if (action === 'Activation') {
    bodyText = mailTexts.activationMailText['el'](token, user.mail, config.WEB_BASE_URL.url)
    subject = mailTexts.activationMailSubject['el'].normalUser
    if (user.scope > 1) {
      subject = mailTexts.activationMailSubject['el'].privUser
    }
    from = mailTexts.activationMailFrom.el
  } else if (action === 'Reset Mail') {
    bodyText = mailTexts.resetMailText['el'](token, user.uid, config.WEB_BASE_URL.url)
    subject = mailTexts.resetMailSubject['el'].normalUser
    if (user.scope > 1) {
      subject = mailTexts.resetMailSubject['el'].privUser
    }
    from = mailTexts.resetMailFrom.el
  }

  return {
    from: from,
    to: user.mail,
    subject: subject,
    html: bodyText
  }
}

function validateIputForReset (user, resetMail) {
  return (user.dn && user.mail === resetMail)
}

function buildTokenAndMakeEntryForReset (user) {
  return new Promise(
    function (resolve, reject) {
      let token = buildToken()
      let tmpResetRequest = new database.UserPassReset({
        uid: user.uid,
        dn: user.dn,
        mail: user.mail,
        token: token
      })
      tmpResetRequest.save(function (err, user) {
        if (err) {
          reject(new PromiseError(2221, err))
        } else {
          resolve(token)
        }
      })
    })
}

function buildToken () {
  return crypto.randomBytes(45).toString('hex')
}

function ldapSearchQueryFormat (query, isPublic) {
  return new Promise(
    function (resolve, reject) {
      let formatedLimit
      let attributesPermitted
      let searchAttr
      isPublic ? attributesPermitted = ['id', 'displayName', 'displayName;lang-el', 'description', 'secondarymail', 'eduPersonAffiliation', 'title', 'telephoneNumber', 'labeledURI', 'eduPersonEntitlement', 'street', 'gecos'] : attributesPermitted = []
      isPublic ? searchAttr = [filter.attribute('eduPersonAffiliation').contains('staff')] : searchAttr = []

      attributesPermitted = functionsUser.buildFieldsQueryLdap(attributesPermitted, query)
      formatedLimit = buildLimitQueryLdap(query)
      searchAttr = buildFilterQueryLdap(attributesPermitted, query, searchAttr)
      let output = filter.AND(searchAttr)
      if (output.filters.length > 0 || !isPublic) {
        resolve({
          filter: output.toString(),
          scope: 'sub',
          paged: {pageSize: 250, pagePause: false},
          sizeLimit: formatedLimit,
          attributes: attributesPermitted
        })
      } else {
        reject(new PromiseError(2252, null))
      }
    })
}

function buildFilterQueryLdap (attributesPermitted, query, searchAttr) {
  try {
    if (Object.prototype.hasOwnProperty.call(query, 'q')) {
      let queryQ = JSON.parse(query.q)
      if (!_.isEmpty(queryQ)) {
        searchAttr = []
        Object.keys(queryQ).forEach(function (attr) {
          if (isAttributeInPublicAttributes(attr, attributesPermitted) || attributesPermitted.length === 0) {
            if (isAttributeInteger(attr) || attr === 'labeledURI' || attr === 'eduPersonEntitlement' || attr === 'eduPersonAffiliation') {
              searchAttr.push(filter.attribute(attr).equalTo(queryQ[attr]))
            } else {
              searchAttr.push(filter.attribute(attr).contains(queryQ[attr]))
            }
          }
        })
      }
    }
    return searchAttr
  } catch (err) {
    throw new ApplicationError(null, null, 2251, null, 'Το query σας ειναι λάθος δομημένο', null, 500)
  }
}

function isAttributeInteger (attr) {
  return INTEGER_FIELDS.indexOf(attr) > -1
}

function isAttributeInPublicAttributes (attribute, attributesPublic) {
  return attributesPublic.indexOf(attribute) > -1
}

function buildLimitQueryLdap (query) {
  if (Object.prototype.hasOwnProperty.call(query, 'limit')) {
    return parseInt(query.limit)
  }
}

function checkForSorting (users, query) {
  let usersSorted = users
  if (Object.prototype.hasOwnProperty.call(query, 'sort')) {
    usersSorted = users.sort(dynamicSort(query.sort))
  }
  return usersSorted
}

function dynamicSort (property) {
  let sortOrder = 1
  if (property[0] === '-') {
    sortOrder = -1
    property = property.substr(1)
  }
  return function (a, b) {
    let result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0
    return result * sortOrder
  }
}

module.exports = {
  passwordsAreDifferent,
  oldPassIsCorrect,
  newPasswordExistsInHistory,
  sendEmailToken,
  buildEmailToken,
  validateIputForReset,
  buildTokenAndMakeEntryForReset,
  deleteResetToken,
  passwordsAreSame,
  ldapSearchQueryFormat,
  checkForSorting,
  buildToken
}
