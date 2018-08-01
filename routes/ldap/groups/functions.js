const ApplicationErrorClass = require('../../applicationErrorClass')
const database = require('../../../configs/database')
const ldapFunctions = require('../../ldapFunctions')

function searchGroupsOnLDAP (ldap, options) {
  return new Promise(
    function (resolve, reject) {
      let groups = []
      ldap.search('ou=groups,dc=it,dc=teithe,dc=gr', options, function (err, results) {
        results.on('searchEntry', function (entry) {
          delete entry.object.controls
          groups.push(entry.object)
        })
        results.on('error', function (err) {
          reject(new ApplicationErrorClass(null, null, 32, err, 'Παρακαλώ δοκιμάστε αργότερα', null, 500))
        })
        results.on('end', function (result) {
          resolve(groups)
        })
      })
    })
}

function getNextGidNumber () {
  return new Promise(
    function (resolve, reject) {
      database.LDAPConfigs.findOne({conf: 'gidNumber'}).exec(function (err, group) {
        if (err) {
          reject(new ApplicationErrorClass('addGroup', err, 94, null, 'Συνέβη κάποιο σφάλμα κατα την δημιουργία ομάδας', null, 500))
        }
        database.LDAPConfigs.findOneAndUpdate({conf: 'gidNumber'}, {
          '$inc': {'value': +1}
        }).exec(function (err, post) {
          if (err) {
            reject(new ApplicationErrorClass('addGroup', err, 95, null, 'Συνέβη κάποιο σφάλμα κατα την δημιουργία ομάδας', null, 500))
          }
          resolve(group.value)
        })
      })
    })
}

function addGroupToLdap (ldapBinded, group) {
  return new Promise(
    function (resolve, reject) {
      ldapBinded.add('cn=' + group.cn + ',ou=groups,dc=it,dc=teithe,dc=gr', group, function (err) {
        if (err) {
          reject(new ApplicationErrorClass('addGroup', err, 96, null, 'Συνέβη κάποιο σφάλμα κατα την δημιουργία ομάδας', null, 500))
        }
        resolve()
      })
    })
}

function checkIfGroupExists (ldapBinded, cn) {
  return new Promise(
    function (resolve, reject) {
      let options = ldapFunctions.buildOptions('(cn=' + cn + ')', 'sub', [])
      searchGroupsOnLDAP(ldapBinded, options).then(groups => {
        if (groups.length === 0) {
          resolve()
        } else {
          reject(new ApplicationErrorClass('addGroup', null, 97, null, 'Η ομάδα υπάρχει ήδη', null, 500))
        }
      })
    })
}

module.exports = {
  searchGroupsOnLDAP,
  getNextGidNumber,
  addGroupToLdap,
  checkIfGroupExists
}