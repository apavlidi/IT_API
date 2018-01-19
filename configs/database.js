const mongoose = require('mongoose');
let Schema = mongoose.Schema;

const accountTypesSchema = Schema({
    title: String,
    dec: String,
    value: String, //eduPersonAffiliation value
    basedn: String,
    primary: []
});

const LDAPConfigsSchema = Schema({
    conf: String,
    value: {type: Number, default: 1}
});

const fileSchema = new Schema({
    name: {type: String, required: true},
    _announcement: {type: Schema.Types.ObjectId, ref: 'Announcements'},
    data: Buffer,
    contentType: String
});

const announcementsCategoriesSchema = new Schema({
    name: {type: String, required: true},
    value: String,
    wid: Number,
    public: Boolean,
    registered: [String]
});

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
        }]
});


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
});

const announcementsSchema = new Schema({
    _about: {type: Schema.Types.ObjectId, ref: 'AnnouncementsCategories', required: true},
    wordpressId: Number,
    date: {type: Date, default: Date.now /*, expires: '90d'*/}, //3600(H)*24(D)*7(W)*4(M)*3(3M) = 3months
    title: {type: String, required: true},
    titleEn: {type: String, required: true},
    attachments: [{type: Schema.Types.ObjectId, ref: 'File'}],
    text: String,
    textEn: String,
    publisher: {
        name: String,
        id: String
    }
});

announcementsSchema.index({date: 1}, {expireAfterSeconds: 0});


//middlewares
announcementsCategoriesSchema.pre('remove', function (next) {
    Announcements.find({_about: this._id}, '_id', function (err, announcementsIds) {
        Announcements.remove(
            {_id: {$in: announcementsIds}}
        ).exec(function (err, announcementsDeleted) {
            if (err) {
                next();
            } else {
                next();
            }
        });
    });
});


profileSchema.pre('remove', function (next) {
    let profile = this;
    Announcements.find({'publisher.id': profile.ldapId}, '_id', function (err, announcementsIds) {
        announcementsIds.forEach(announcementId => {
            Announcements.findOne({_id: announcementId}, function (err, announcement) {
                announcement.remove(function (err, result) {
                    AnnouncementsCategories.update({}, {"$pull": {"registered": profile.ldapId}}, {multi: true}, function (err, result) {
                        next();
                    });
                });
            })
        });
    });

    AnnouncementsCategories.update({}, {"$pull": {"registered": profile.ldapId}}, {multi: true}, function (err, result) {
        next();
    });
});


announcementsSchema.pre('remove', function (next) {
    console.log(this);
    let ids = null;
    Notification.find({'related.id': this._id}, '_id', function (err, notificationsIds) {
        ids = notificationsIds.map(function (a) {
            return a._id;
        });
        Notification.remove(
            {_id: {$in: notificationsIds}}
        ).exec(function (err, notificationsDeleted) {
            Profile.update({}, {"$pull": {"notifications": {"_notification": {$in: ids}}}}, {multi: true}, function (err, result) {
                if (err) {
                    next();
                } else {
                    next();
                }
            });

        });
    });

    this.attachments.forEach(attachment => {
        File.findByIdAndRemove({_id: attachment}, function (err) {
            if (err) {
                console.log(err)
            }
            next();
        })
    })
});

const userRegSchema = Schema({
    uid: String,
    dn: String,
    scope: String,
    mail: String,
    token: String,
    createdAt: {type: Date, expires: 60 * 60 * 48, default: Date.now}
});

const userPwdResetSchema = Schema({
    uid: String,
    dn: String,
    mail: String,
    token: String,
    createdAt: {type: Date, expires: 60 * 60 * 1, default: Date.now}
});

const Announcements = mongoose.model('Announcements', announcementsSchema);
const AnnouncementsCategories = mongoose.model('AnnouncementsCategories', announcementsCategoriesSchema);
const File = mongoose.model('File', fileSchema);
const AccountType = mongoose.model('AccountType', accountTypesSchema);
const LDAPConfigs = mongoose.model('LDAPConfigs', LDAPConfigsSchema);
const UserReg = mongoose.model('UserReg', userRegSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const Profile = mongoose.model('Profile', profileSchema);
const UserPassReset = mongoose.model('UserPassReset', userPwdResetSchema);

module.exports = {
    Announcements: Announcements,
    AnnouncementsCategories: AnnouncementsCategories,
    File: File,
    AccountType: AccountType,
    LDAPConfigs: LDAPConfigs,
    UserReg: UserReg,
    Profile: Profile,
    Notification: Notification,
    UserPassReset: UserPassReset
}
