const jwt = require('jsonwebtoken')
const fs = require('fs')
const Promise = require('promise')
const ldap = require('ldapjs')

const audience = '59a99d5989ef64657780879c'

const cert = fs.readFileSync('./public.pem')  // get public key
const config = require('./config')

const ldapClient = ldap.createClient({
  url: config.LDAP[process.env.NODE_ENV].host
})

function getUser (userID) {
  return new Promise(
    function (resolve, reject) {
      let opts = {
        filter: '(id=' + userID + ')',
        scope: 'sub',
        attributes: []
      }

      ldapClient.search(config.LDAP[process.env.NODE_ENV].baseUserDN, opts, function (err, results) {
        let user = {}
        if (err) {
          reject({
            type: 'SearchUserError',
            code: 4004,
            httpCode: 500,
            message: 'Unexpected user search error, please try again later.'
          })
        }
        else {
          let error = false
          results.on('searchEntry', function (entry) {
            let tmp = entry.object
            delete tmp.controls
            user = tmp
          })
          results.on('error', function (err) {
            reject({
              type: 'SearchUserError',
              code: 4005,
              httpCode: 500,
              message: 'Unexpected user search error, please try again later.'
            })
            error = true
          })
          results.on('end', function (result) {
            if (!err)
              resolve(user)
          })
        }
      })
    })
}

function checkToken (token, scopeRequired, userScopeRequired) {
  return new Promise(
    function (resolve, reject) {
      jwt.verify(token, cert, {audience: audience}, function (err, tokenInfo) {
        if (err) {
          if (err.name == 'TokenExpiredError')
            reject({
              type: 'TokenExpiredError',
              code: 4001,
              httpCode: 400,
              message: 'Access token has expired.'
            })
          else
            reject({
              type: 'TokenError',
              code: 4002,
              httpCode: 400,
              message: 'An active access token required to complete this action.'
            })
        }
        else {
          //doulevei den exw idea ti kanei to every
          if (scopeRequired.every(val => tokenInfo.scope.includes(val))) {
            getUser(tokenInfo.userId)
              .then(function (user) {
                if (user.eduPersonScopedAffiliation >= userScopeRequired) {
                  resolve(user)
                }
                else {
                  reject({
                    type: 'UserPermissionError',
                    code: 4006,
                    httpCode: 400,
                    message: 'Permission denied. User cannot access this resource.'
                  })
                }
              }, function (err) {
                reject(err)
              })
          } else {
            reject({
              type: 'TokenError',
              code: 4003,
              httpCode: 400,
              message: 'Access token doesn\'t have the required scope to complete this action. Scope required : ' + scopeRequired
            })
          }
        }
      })
    })
}

/**
 *
 * @param scopeRequired : scope_name = access token scope required to access this function
 * @param userScopeRequired : 1-9 = eduPersonScopedAffiliation value required
 * @param ignoreToken : True/False = continue even if the token doesn't exist
 * @returns req.user
 */
function checkAuth (scopeRequired, userScopeRequired, ignoreToken) {
  return function (req, res, next) {
    let token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token']
    checkToken(token, scopeRequired, userScopeRequired)
      .then(function (user) {
        req.user = user
        next()
      }, function (err) {
        if (ignoreToken)
          next()
        else
          next(err)
      })

  }
}

module.exports = {
  checkAuth
}
