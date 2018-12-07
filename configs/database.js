const mongoose = require('mongoose')
let Schema = mongoose.Schema

mongoose.Promise = global.Promise

const accountTypesSchema = Schema({
  title: String,
  dec: String,
  value: String, //eduPersonAffiliation value
  basedn: String,
  primary: []
})

const LDAPConfigsSchema = Schema({
  conf: String,
  value: {type: Number, default: 1}
})

const fileSchema = new Schema({
  name: {type: String, required: true},
  _announcement: {type: Schema.Types.ObjectId, ref: 'Announcements'},
  data: Buffer,
  contentType: String
})

const announcementsCategoriesSchema = new Schema({
  name: {type: String, required: true},
  value: String,
  wid: Number,
  public: Boolean,
  registered: [String]
})

const profileSchema = new Schema({
  ldapId: String,
  profilePhoto: {data: Buffer, contentType: String},
  socialMedia: {
    facebook: String,
    twitter: String,
    linkedIn: String,
    googlePlus: String,
    github: String,
    socialMediaExtra: [{
      name: String,
      url: String
    }],
  },
  notifications: [{
    _notification: {type: Schema.Types.ObjectId, ref: 'Notification'},
    seen: Boolean
  }],
  notySub:
    [{
      browserFp: {type: String},
      endpoint: {type: String},
      auth: {type: String},
      p256dh: {type: String},
      enabled: {type: Boolean}
    }],
  notyAndroidSub:
    [{
      deviceToken: {type: String}
    }]
})

const notificationSchema = new Schema({
  userId: String,
  text: String,
  nameEn: String,
  nameEl: String,
  related: {id: String, type: {type: Schema.Types.ObjectId, refPath: 'related.id'}},
  date: {
    type: Date,
    default: Date.now
  }
})

const announcementsSchema = new Schema({
  _about: {type: Schema.Types.ObjectId, ref: 'AnnouncementsCategories', required: true},
  wordpressId: Number,
  date: {type: Date, default: Date.now},
  title: {type: String, required: true},
  titleEn: {type: String, required: true},
  attachments: [{type: Schema.Types.ObjectId, ref: 'File'}],
  text: String,
  textEn: String,
  publisher: {
    name: String,
    id: String
  }
})

//middlewares
announcementsCategoriesSchema.pre('remove', function (next) {
  console.log('middl')
  Announcements.find({_about: this._id}, '_id', function (err, announcementsIds) {
    announcementsIds.forEach(announcementId => {
      Announcements.findOne({_id: announcementId}, function (err, announcement) {
        announcement.remove(function () {
        })
      })
    })
  })
  next()
})

profileSchema.pre('remove', function (next) {
  let profile = this
  Announcements.find({'publisher.id': profile.ldapId}, '_id', function (err, announcementsIds) {
    announcementsIds.forEach(announcementId => {
      Announcements.findOne({_id: announcementId}, function (err, announcement) {
        announcement.remove(function () {
        })
      })
    })
  })

  AnnouncementsCategories.update({}, {'$pull': {'registered': profile.ldapId}}, {multi: true}, function () {
    next()
  })
})

announcementsSchema.pre('remove', function (next) {
  let ids = null
  Notification.find({'related.id': this._id}, '_id', function (err, notificationsIds) {
    ids = notificationsIds.map(function (a) {
      return a._id
    })

    Notification.remove(
      {_id: {$in: notificationsIds}}
    ).exec(function () {
      Profile.update({}, {'$pull': {'notifications': {'_notification': {$in: ids}}}}, {multi: true}, function (err) {
        if (err) {
          next()
        } else {
          next()
        }
      })

    })
  })

  this.attachments.forEach(attachment => {
    File.findByIdAndRemove({_id: attachment}, function (err) {
      if (err) {
        console.log(err)
      }
      next()
    })
  })
})

const userRegMailTokenSchema = Schema({
  uid: String,
  dn: String,
  scope: String,
  mail: String,
  token: String,
  createdAt: {type: Date, expires: 60 * 60 * 48, default: Date.now}
})

const userRegSchema = Schema({
  uid: String,
  dn: String,
  token: String,
  scope: Number,
  createdAt: {type: Date, expires: 60, default: Date.now}
})

const userPwdResetSchema = Schema({
  uid: String,
  dn: String,
  mail: String,
  token: String,
  createdAt: {type: Date, expires: 60, default: Date.now}
})

const UserReg = mongoose.model('UserReg', userRegSchema)
const Announcements = mongoose.model('Announcements', announcementsSchema)
const AnnouncementsCategories = mongoose.model('AnnouncementsCategories', announcementsCategoriesSchema)
const File = mongoose.model('File', fileSchema)
const AccountType = mongoose.model('AccountType', accountTypesSchema)
const LDAPConfigs = mongoose.model('LDAPConfigs', LDAPConfigsSchema)
const UserRegMailToken = mongoose.model('UserRegMailToken', userRegMailTokenSchema)
const Notification = mongoose.model('Notification', notificationSchema)
const Profile = mongoose.model('Profile', profileSchema)
const UserPassReset = mongoose.model('UserPassReset', userPwdResetSchema)

module.exports = {
  Announcements,
  AnnouncementsCategories,
  File,
  AccountType,
  LDAPConfigs,
  UserReg,
  Profile,
  Notification,
  UserPassReset,
  UserRegMailToken
}
