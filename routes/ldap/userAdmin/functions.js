const ApplicationErrorClass = require('../../applicationErrorClass')
const config = require('../../../configs/config')
const database = require('../../../configs/database')
const ldap = require('ldapjs')
const ldapConfig = require('../../../configs/ldap')
const functionsUser = require('../../user/functionsUser')

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
      console.log(newUser)
      let basedn = newUser.basedn
      if (newUser.eduPersonScopedAffiliation > config.PERMISSIONS.student) {
        newUser.displayName = newUser.cn
        newUser['displayName;lang-el'] = newUser['cn;lang-el']
      }
      delete newUser.basedn //It must be deleted!

      checkIfUserExists(ldapBinded, newUser, basedn).then(result => {
        console.log('y')

        let err = result[0]
        let matchedStatus = result[1]

        if (doesNotExist(err, newUser.status)) {
          console.log('y2')

          getNextUidNumber().then(uid => {
            newUser.uidNumber = uid
            return getNextIdNumber()
          }).then(id => {
            console.log('y3')

            newUser.id = id
            console.log(newUser)

            console.log(newUser.uid)
            console.log(basedn)

            ldapBinded.add(ldapBaseDN(newUser.uid, basedn), newUser, function (err) {
              if (err) {
                console.log(err)
                console.log('y4')

                reject(new ApplicationErrorClass('addUser', null, 83, err, 'Συνέβη κάποιο σφάλμα κατα την δημιουργία χρήστη', null, 500))
              } else {
                console.log('y5')

                resolve()
              }
            })
          })
        } else {
          reject(new ApplicationErrorClass('addUser', null, 103, err, 'Ο χρήστης υπάρχει ήδη', null, 500))
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
  return (err && status == 1)
}

function getNextUidNumber () {
  return new Promise(
    function (resolve, reject) {
      database.LDAPConfigs.findOne({conf: 'uidNumber'}).exec(function (err, uid) {
        if (err) {
          reject(new ApplicationErrorClass('addUser', err, 83, null, 'Συνέβη κάποιο σφάλμα κατα την δημιουργία χρήστη', null, 500))
        }
        database.LDAPConfigs.findOneAndUpdate({conf: 'uidNumber'}, {
          '$inc': {'value': +1}
        }).exec(function (err, post) {
          if (err) {
            reject(new ApplicationErrorClass('addUser', err, 82, null, 'Συνέβη κάποιο σφάλμα κατα την δημιουργία χρήστη', null, 500))
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
          reject(new ApplicationErrorClass('addUser', err, 82, null, 'Συνέβη κάποιο σφάλμα κατα την δημιουργία χρήστη', null, 500))
        }
        database.LDAPConfigs.findOneAndUpdate({conf: 'id'}, {
          '$inc': {'value': +1}
        }).exec(function (err, post) {
          if (err) {
            reject(new ApplicationErrorClass('addUser', err, 81, null, 'Συνέβη κάποιο σφάλμα κατα την δημιουργία χρήστη', null, 500))
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
          reject(new ApplicationErrorClass('deleteUser', null, 85, err, 'Συνέβη κάποιο σφάλμα κατα την διαγραφή χρήστη', null, 500))
        } else {
          if (profile) {
            profile.remove(function (err) {
              if (err) {
                reject(new ApplicationErrorClass('deleteUser', null, 84, err, 'Συνέβη κάποιο σφάλμα κατα την διαγραφή χρήστη', null, 500))
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
            reject(new ApplicationErrorClass('updateUser', null, 101, err, 'Συνέβη κάποιο σφάλμα κατα την ενημέρωση χρήστη', null, 500))
          } else {
            resolve()
          }
        })
      } else {
        reject(new ApplicationErrorClass('updateUser', null, 101, null, 'Αυτό το πεδίο δεν μπορεί να αλλάξει', null, 500))
      }
    })
}

function removeUserFromLdap (ldabBinded, userDN) {
  return new Promise(
    function (resolve, reject) {
      ldabBinded.del(userDN, function (err) {
        if (err) {
          reject(new ApplicationErrorClass('deleteUser', null, 86, err, 'Συνέβη κάποιο σφάλμα κατα την διαγραφή χρήστη', null, 500))
        } else {
          resolve()
        }
      })
    })
}

function fieldsQuery (user, query) {
  let attributesPermitted = functionsUser.buildFieldsQueryLdap([],query)
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