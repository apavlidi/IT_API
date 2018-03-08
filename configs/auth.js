const jwt = require('jsonwebtoken')
const fs = require('fs')
const Promise = require('promise')
const ldap = require('ldapjs')

const audience = '59a99d5989ef64657780879c'

const cert = fs.readFileSync('public.pem')  // get public key
const config = require('./config')
const scopeAttrs = require('./scope')

const ldapClient = ldap.createClient({
  url: config.LDAP[process.env.NODE_ENV].host
})

function getUser (userID, attrs) {
  return new Promise(
    function (resolve, reject) {
      let opts = {
        filter: '(id=' + userID + ')',
        scope: 'sub',
        attributes: attrs
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

function checkToken (token, scopeRequired,userScopeRequired) {
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
          if (tokenInfo.scope.indexOf(scopeRequired) > -1) {
            getUser(tokenInfo.userId, scopeAttrs[scopeRequired])
              .then(function (user) {
                if(user.eduPersonScopedAffiliation >= userScopeRequired){
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
 * @param needAuth : True/False = Needs a access token or not
 * @param scopeRequired : scope_name = access token scope required to access this function
 * @param userScopeRequired : 1-9 = eduPersonScopedAffiliation value required
 * @param goNextOnFail : True/False = continue even if the scope and eduPersonScopedAffiliation required don't meet
 * @returns req.user
 */
function checkAuth (needAuth, scopeRequired, userScopeRequired,goNextOnFail) {
  return function (req, res, next) {
    if (!needAuth) {
      next()
    }
    else {
      let token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token']
      checkToken(token, scopeRequired,userScopeRequired)
        .then(function (user) {
          req.user = user
          next()
        }, function (err) {
          if(goNextOnFail)
            next()
          else
            next(err)
        })

    }
  }
}


/*
checkToken('eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ODczIiwic2NvcGUiOlsiaWQiLCJjbiIsInVpZCIsImVkdVBlcnNvblNjb3BlZEFmZmlsaWF0aW9uIl0sImhhc2giOiIxeGRuZnNyY2Rsdzc0M3B5YWU5dCIsImlhdCI6MTUyMDQ1MTk1MCwiZXhwIjoxNTIwNDUyMDcwLCJhdWQiOlsiNTlhOTlkNTk4OWVmNjQ2NTc3ODA4NzljIl19.SeLY3zMOncHq62oUfoSS_B2Kf6hj-YBT1DN9JlPxqrWXF6f_Miy8_dgvr0w5qL5A9f89td6aie9CtS1hIX8NnYW8B6HkbyQ5Z7vLKq9ZzpfcNGM6GtnL6LVxVlBN7vQoL4Ys1RBYo4SiCmCqDrMZWdaIUTEnYnMgFNpNLZ-Vf63ROohbPOQriR1gTnyktlRyrt3wF9UE6bMxBVT97mENQ_yW2hh55oNwcsytYKQPoSDnpBHmE-zKl51nce9E7BGAsVzykg9JithZF79UzqiuAxIabeFYQhG-wytLyBjxf2lSWTbbb3dAvVPVP9qjqQ6fjKEFOfoTf1719r_P9mxODOV190ykdRy-6FEqME3ULQA-tl94xjOvuqeO4LDvVM0D4TREcO1onkggYKmyspv6klBYQWmuYmO4pOWL_Yu-BA969p3KPSFKeI4rOnDGL9zgnYPI-GPMcTnD1U6MB8rA0xl1icLiz5x8ba14U9O8xCprRczYw0UKCz6OfnV5axaBdwzcQbzgEIgaATpkvo3qUe17ashoV8BeSfopav_Q2CSgVFx-n-ccmgZ1k9BHGB0x1iWjlEaI95u-sNPKrvVp_znFWslIhPFS_4qSKMGiTCNCAbLXpRFY3UkheXmXeemsRhELc5OZCAPsgc_Bo7DtZc5EivqYWQL7-6dEjeagIlI','uid',1)
  .then(function (ok) {
    console.log(ok)

  },
    function (err) {
      console.log(err)
    })

    */

module.exports = {
  checkAuth
}