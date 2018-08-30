const database = require('../../../configs/database')
const ldapFunctions = require('../../ldapFunctions')
const PromiseError = require('../../promiseErrorClass')

function searchGroupsOnLDAP (ldap, options) {
  return new Promise(
    function (resolve, reject) {
      let groups = []
      ldap.search('ou=groups,dc=it,dc=teithe,dc=gr', options, function (err, results) {
        if (err) {
          reject(new PromiseError(3201, err))
        }
        results.on('searchEntry', function (entry) {
          delete entry.object.controls
          groups.push(entry.object)
        })
        results.on('error', function (err) {
          reject(new PromiseError(3200, err))
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
          reject(new PromiseError(3212, err))
        }
        database.LDAPConfigs.findOneAndUpdate({conf: 'gidNumber'}, {
          '$inc': {'value': +1}
        }).exec(function (err, post) {
          if (err) {
            reject(new PromiseError(3213, err))
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
          reject(new PromiseError(3214, err))
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
          reject(new PromiseError(3211, null))
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
