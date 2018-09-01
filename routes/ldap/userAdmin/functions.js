const PromiseError = require('../../promiseErrorClass')
const config = require('../../../configs/config')
const database = require('../../../configs/database')
const ldap = require('ldapjs')
const ldapConfig = require('../../../configs/ldap')
const functionsUser = require('../../user/functionsUser')
const _ = require('lodash')

const ldapBaseDN = (uid, basedn) => {
  return 'uid=' + uid + ',' + basedn
}

function buildUser (reqBody) {
  return {
    uid: reqBody.uid,
    'givenName;lang-el': reqBody.name,
    'sn;lang-el': reqBody.lname,
    eduPersonAffiliation: reqBody.type,
    eduPersonPrimaryAffiliation: reqBody.typeP,
    eduPersonScopedAffiliation: reqBody.scope,
    mail: reqBody.mail,
    status: 1,
    userPassword: ldapConfig.DEFAULT_PASSWORD,
    gidNumber: reqBody.gid,
    basedn: reqBody.basedn,
    am: reqBody.am,
    title: reqBody.title,
    'title;lang-el': reqBody.titleGr
  }
}

function createUser (ldapBinded, newUser) {
  return new Promise(
    function (resolve, reject) {
      let basedn = newUser.basedn
      if (newUser.eduPersonScopedAffiliation > config.PERMISSIONS.student) {
        newUser.displayName = newUser.cn
        newUser['displayName;lang-el'] = newUser['cn;lang-el']
      }
      delete newUser.basedn // It must be deleted!

      checkIfUserExists(ldapBinded, newUser, basedn).then(result => {
        let err = result[0]
        if (doesNotExist(err, newUser.status)) {
          getNextUidNumber().then(uid => {
            newUser.uidNumber = uid
            return getNextIdNumber()
          }).then(id => {
            newUser.id = id
            ldapBinded.add(ldapBaseDN(newUser.uid, basedn), newUser, function (err) {
              if (err) {
                reject(new PromiseError(3315, err))
              } else {
                resolve()
              }
            })
          })
        } else {
          reject(new PromiseError(3316, err))
        }
      })
    })
}

function checkIfUserExists (ldapBinded, newUser, basedn) {
  return new Promise(
    function (resolve) {
      ldapBinded.compare(ldapBaseDN(newUser.uid, basedn), 'status', newUser.status + '', function (err, matchedStatus) {
        resolve([err, matchedStatus])
      })
    })
}

function doesNotExist (err, status) {
  return (err && parseInt(status) === 1)
}

function getNextUidNumber () {
  return new Promise(
    function (resolve, reject) {
      database.LDAPConfigs.findOne({conf: 'uidNumber'}).exec(function (err, uid) {
        if (err) {
          reject(new PromiseError(3311, err))
        }
        database.LDAPConfigs.findOneAndUpdate({conf: 'uidNumber'}, {
          '$inc': {'value': +1}
        }).exec(function (err, post) {
          if (err) {
            reject(new PromiseError(3312, err))
          }
          resolve(uid.value)
        })
      })
    })
}

function getNextIdNumber () {
  return new Promise(
    function (resolve, reject) {
      database.LDAPConfigs.findOne({conf: 'id'}).exec(function (err, id) {
        if (err) {
          reject(new PromiseError(3313, err))
        }
        database.LDAPConfigs.findOneAndUpdate({conf: 'id'}, {
          '$inc': {'value': +1}
        }).exec(function (err, post) {
          if (err) {
            reject(new PromiseError(3314, err))
          }
          resolve(id.value)
        })
      })
    })
}

function removeProfileUser (userID) {
  return new Promise(
    function (resolve, reject) {
      database.Profile.findOne({'ldapId': userID}, function (err, profile) {
        if (err) {
          reject(new PromiseError(3333, err))
        } else {
          if (profile) {
            profile.remove(function (err) {
              if (err) {
                reject(new PromiseError(3334, err))
              } else {
                resolve()
              }
            })
          } else {
            resolve()
          }
        }
      })
    })
}

function modifyAttributeOnLdapbyAdmin (ldapBinded, attribute, value, user) {
  return new Promise(
    function (resolve, reject) {
      if (_.includes(ldapConfig.PERMITTED_FIELDS_TO_MODIFY_IN_ADMIN, attribute)) {
        let tmpMod = {
          operation: 'replace',
          modification: {}
        }
        tmpMod.modification[attribute] = value
        let change = new ldap.Change(tmpMod)
        ldapBinded.modify(user.dn, change, function (err) {
          if (err) {
            reject(new PromiseError(3341, err))
          } else {
            resolve()
          }
        })
      } else {
        reject(new PromiseError(3342, null))
      }
    })
}

function removeUserFromLdap (ldabBinded, userDN) {
  return new Promise(
    function (resolve, reject) {
      ldabBinded.del(userDN, function (err) {
        if (err) {
          reject(new PromiseError(3332, err))
        } else {
          resolve()
        }
      })
    })
}

function fieldsQuery (user, query) {
  let attributesPermitted = functionsUser.buildFieldsQueryLdap([], query)
  let filteredUser = Object.keys(user)
    .filter(key => attributesPermitted.includes(key))
    .reduce((obj, key) => {
      obj[key] = user[key]
      return obj
    }, {})
  return filteredUser
}

module.exports = {
  createUser,
  buildUser,
  removeUserFromLdap,
  removeProfileUser,
  modifyAttributeOnLdapbyAdmin,
  checkIfUserExists,
  doesNotExist,
  ldapBaseDN,
  fieldsQuery
}
