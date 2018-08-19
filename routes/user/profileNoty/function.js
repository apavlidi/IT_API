const database = require('../../../configs/database')
const ApplicationErrorClass = require('./../../applicationErrorClass')
const MAXIMUM_SUBSCRIPTIONS = 4

function checkIfSubscribedAlready (user, browserFp) {
  return new Promise(
    function (resolve, reject) {
      database.Profile.findOne({
        ldapId: user,
        'notySub.browserFp': browserFp
      }, function (err, profileNotySub) {
        if (err) {
          reject(new ApplicationErrorClass(null, null, 2063, err, 'Υπήρχε σφάλμα κατα την ενημέρωση εγγραφης', null, 500))
        }
        if (profileNotySub) {
          resolve({isSubscribed: true, profile: profileNotySub})
        } else {
          resolve({isSubscribed: false, profile: null})
        }
      })
    })
}

function disableAllNotiesSub (profile) {
  return new Promise(
    function (resolve, reject) {
      profile.notySub.forEach(notySub => {
        notySub.enabled = false
      })
      profile.save(function (err) {
        if (err) {
          reject(new ApplicationErrorClass(null, null, 2061, err, 'Υπήρχε σφάλμα κατα την ενημέρωση εγγραφης', null, 500))
        } else {
          resolve()
        }
      })
    })
}

function modifyNotySub (profile, reqBody, action) {
  return new Promise(
    function (resolve, reject) {
      let notySubPos = getPositionOfNotySub(profile.notySub, reqBody.browserFp)
      profile.notySub[notySubPos].enabled = action
      profile.save(function (err) {
        if (err) {
          reject(new ApplicationErrorClass(null, null, 2051, err, 'Υπήρχε σφάλμα κατα την απενεργοποίηση', null, 500))
        } else {
          resolve()
        }
      })
    })
}

function createNewNotySubscription (profile, reqBody) {
  return new Promise(
    function (resolve, reject) {
      let newNotySub = {
        auth: reqBody.auth,
        p256dh: reqBody.p256dh,
        endpoint: reqBody.endpoint,
        browserFp: reqBody.browserFp,
        enabled: true
      }
      if (isNotMaximumSubscriptions(profile.notySub.length)) {
        profile.notySub.push(newNotySub)
      } else {
        profile.notySub.pop()
        profile.notySub.push(newNotySub)
      }
      profile.save(function (err) {
        if (err) {
          reject(new ApplicationErrorClass(null, null, 2052, err, 'Υπήρχε σφάλμα κατα την εγγραφή', null, 500))
        } else {
          resolve()
        }
      })
    })
}

function isNotMaximumSubscriptions (subscriptionCounter) {
  return subscriptionCounter < MAXIMUM_SUBSCRIPTIONS
}

function getPositionOfNotySub (notySubs, fp) {
  let found = notySubs.find(function (ele) {
    return ele.browserFp === fp
  })
  return notySubs.map(function (x) {
    return x._id
  }).indexOf(found._id)
}

module.exports = {
  checkIfSubscribedAlready,
  getPositionOfNotySub,
  modifyNotySub,
  createNewNotySubscription,
  disableAllNotiesSub
}
