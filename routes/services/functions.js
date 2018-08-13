const ApplicationErrorClass = require('./../applicationErrorClass')
const config = require('../../configs/config')
const ldap = require('ldapjs')

function activateUser (user) {
  return new Promise(
    function (resolve, reject) {
      let changes = []
      let addObjectClass = new ldap.Change({
        operation: 'add',
        modification: {
          objectClass: ['extensibleObject']
        }
      })
      changes.push(addObjectClass)
      let changeInfo = new ldap.Change({
        operation: 'add',
        modification: {
          info: ['active']
        }
      })
      changes.push(changeInfo)
      let changeLoginShell = new ldap.Change({
        operation: 'replace',
        modification: {
          loginShell: ['/bin/bash']
        }
      })
      changes.push(changeLoginShell)
      let changeHomeDir
      if (user.eduPersonAffiliation == 'student') {
        let tmpHomeDir = '/home/' + user.eduPersonAffiliation + '/' + user.eduPersonPrimaryAffiliation + '/' + user.regyear + '/' + user.uid
        changeHomeDir = new ldap.Change({
          operation: 'replace',
          modification: {
            homeDirectory: tmpHomeDir
          }
        })
      } else {
        let tmpHomeDir = '/home/' + user.eduPersonAffiliation + '/' + user.uid
        changeHomeDir = new ldap.Change({
          operation: 'replace',
          modification: {
            homeDirectory: tmpHomeDir
          }
        })
      }
      changes.push(changeHomeDir)
      resolve(changes)
    })
}

module.exports = {
  activateUser
}