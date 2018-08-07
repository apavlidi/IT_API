const ApplicationErrorClass = require('../../applicationErrorClass')
const database = require('../../../configs/database')

//TODO CHECK JSON.PARSE
function addAccountTypeToDB (newType, reqBody) {
  return new Promise(
    function (resolve, reject) {
      if (reqBody.primary) {
        let primaries = JSON.parse(reqBody.primary)
        primaries.forEach(primary => {
          newType.primary.push(primary)
        })
      }
      newType.save(function (err) {
        if (err) {
          reject(new ApplicationErrorClass('addAccountType', null, 3012, err, 'Συνεβη καποιο λάθος κατα την δημιουργία τύπου', null, 500))
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
          reject(new ApplicationErrorClass('addAccountType', null, 3011, err, 'Συνεβη καποιο λάθος κατα την δημιουργία τύπου,ενδεχομένως υπάρχει ήδη.', null, 500))
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
          reject(new ApplicationErrorClass('editAccountType', null, 3031, err, 'Ο τύπος δεν βρέθηκε', null, 500))
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
              reject(new ApplicationErrorClass('editAccountType', null, 3032, err, 'Συνεβη καποιο λάθος κατα την επεξεργασία τύπου', null, 500))
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