const database = require('../../../configs/database')
const PromiseError = require('./../../promiseErrorClass')
const MAXIMUM_SUBSCRIPTIONS = 4

function checkIfSubscribedAlready (user, browserFp) {
  return new Promise(
    function (resolve, reject) {
      database.Profile.findOne({
        ldapId: user,
        'notySub.browserFp': browserFp
      }, function (err, profileNotySub) {
        if (err) {
          reject(new PromiseError(2063, err))
        }
        if (profileNotySub) {
          resolve({isSubscribed: true, profile: profileNotySub})
        } else {
          resolve({isSubscribed: false, profile: null})
        }
      })
    })
}

function checkIfSubscribedAlreadyAndroid (user, deviceToken) {
  return new Promise(
    function (resolve, reject) {
      database.Profile.findOne({
        ldapId: user,
        'notyAndroidSub.deviceToken': deviceToken
      }, function (err, profileNotyAndroidSub) {
        if (err) {
          reject(new PromiseError(2063, err))
        }
        if (profileNotyAndroidSub) {
          resolve({isSubscribed: true, profile: profileNotyAndroidSub})
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
          reject(new PromiseError(2061, err))
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
          reject(new PromiseError(2051, err))
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
          reject(new PromiseError(2052, err))
        } else {
          resolve()
        }
      })
    })
}

function createNewNotyAndroidSubscription (profile, reqBody) {
  return new Promise(
    function (resolve, reject) {
      let newNotySub = {
        deviceToken: reqBody.deviceToken,
      }
      if (isNotMaximumSubscriptions(profile.notyAndroidSub.length)) {
        profile.notyAndroidSub.push(newNotySub)
      } else {
        profile.notyAndroidSub.pop()
        profile.notyAndroidSub.push(newNotySub)
      }
      profile.save(function (err) {
        if (err) {
          reject(new PromiseError(2076, err))
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
  disableAllNotiesSub,
  checkIfSubscribedAlreadyAndroid,
  createNewNotyAndroidSubscription
}
