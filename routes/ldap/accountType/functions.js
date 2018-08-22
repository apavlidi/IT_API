const database = require('../../../configs/database')
const PromiseError = require('../../promiseErrorClass')

function addAccountTypeToDB (newType, reqBody) {
  return new Promise(
    function (resolve, reject) {
      if (reqBody.primary) {
        let primaries
        try {
          primaries = JSON.parse(reqBody.primary)
        } catch (error) {
          reject(new PromiseError(3013, error))
        }
        primaries.forEach(primary => {
          newType.primary.push(primary)
        })
      }
      newType.save(function (err) {
        if (err) {
          reject(new PromiseError(3012, err))
        } else {
          resolve()
        }
      })
    })
}

function addAccountTypeToLDAP (ldabBinded, basedn, value) {
  return new Promise(
    function (resolve, reject) {
      let entry = {
        ou: value
      }
      entry.objectClass = []
      entry.objectClass[0] = 'top'
      entry.objectClass[1] = 'organizationalUnit'

      ldabBinded.add(basedn, entry, function (err) {
        if (err) {
          reject(new PromiseError(3011, err))
        } else {
          resolve()
        }
      })
    })
}

function editAccountType (reqBody, basedn) {
  return new Promise(
    function (resolve, reject) {
      database.AccountType.findOne({basedn: basedn}, function (err, accountType) {
        if (!accountType || err) {
          reject(new PromiseError(3031, err))
        } else {
          console.log(accountType)
          if (reqBody.value_main) {
            accountType.value = reqBody.value_main
          }
          if (reqBody.dec_main) {
            accountType.dec = reqBody.dec_main
          }
          if (reqBody.title_main) {
            accountType.title = reqBody.title_main
          }
          if (reqBody.primary) {
            accountType.primary = JSON.parse(reqBody.primary)
          }
          accountType.save(function (err) {
            if (err) {
              reject(new PromiseError(3032, err))
            } else {
              resolve()
            }
          })
        }
      })
    })
}

module.exports = {
  addAccountTypeToLDAP,
  addAccountTypeToDB,
  editAccountType
}
