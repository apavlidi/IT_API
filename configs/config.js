const LDAP = {
  development: {
    host: 'ldap://192.168.6.89:389',
    user: 'cn=admin,dc=it,dc=teithe,dc=gr',
    password: '5N8!Pvb49$Yz',
    baseUserDN: 'ou=people,dc=it,dc=teithe,dc=gr'
  },
  test: {
    host: 'ldap://192.168.6.30:389',
    user: 'cn=admin,dc=it,dc=teithe,dc=gr',
    password: '5N8!Pvb49$Yz',
    baseUserDN: 'ou=people,dc=it,dc=teithe,dc=gr'
  },
  production: {
    host: 'ldaps://ldap.it.teithe.gr:636',
    user: 'cn=admin,dc=it,dc=teithe,dc=gr',
    password: '***REMOVED***',
    baseUserDN: 'ou=people,dc=it,dc=teithe,dc=gr'
  }
}

const MONGO = {
  development: 'mongodb://192.168.6.85/myapptest',
  test: 'mongodb://192.168.6.85/myapptest',
  production: 'mongodb://192.168.6.85/myapp'
}

const WEB_BASE_URL = {
  url: 'https://apps.it.teithe.gr'
}

const WORDPRESS_CREDENTIALS = {
  url: 'https://www.it.teithe.gr',
  username: 'it_apps',
  password: '***REMOVED***',
  rejectUnauthorized: false
}

const PERMISSIONS = {
  student: 1,
  professor: 2,
  secretariat: 3,
  professorWithMinAccess: 4,
  professorWithMaxAccess: 5,
  futureUseSix: 6,
  futureUseSEven: 7,
  futureUseEight: 8,
  admin: 9
};

/*
const nodemailer = require('nodemailer')
const MAIL = nodemailer.createTransport({
  host: 'smtp.it.teithe.gr',
  port: 25,
  tls: {
    rejectUnauthorized: false
  }
})
*/
module.exports = {
  MONGO,
  WEB_BASE_URL,
  WORDPRESS_CREDENTIALS,
  //MAIL,
  LDAP,
  PERMISSIONS
}
