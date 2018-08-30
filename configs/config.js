const LDAP = {
  development: {
    host: 'ldap://LDAP-SERVER-IP:389',
    user: 'USER',
    password: 'PASSWORD',
    baseUserDN: 'ou=people,dc=it,dc=teithe,dc=gr'
  },
  test: {
    host: 'ldap://LDAP-SERVER-IP:389',
    user: 'USER',
    password: 'PASSWORD',
    baseUserDN: 'ou=people,dc=it,dc=teithe,dc=gr'
  },
  production: {
    host: 'ldap://LDAP-SERVER-IP:389',
    user: 'USER',
    password: 'PASSWORD',
    baseUserDN: 'ou=people,dc=it,dc=teithe,dc=gr'
  }
}

const LDAP_TEI = {
  host: 'ldap://ds.teithe.gr:389',
  baseUserDN: 'ou=people,dc=teithe,dc=gr'
}

const ldap = require('ldapjs')
const LDAP_CLIENT = ldap.createClient({
  url: LDAP[process.env.NODE_ENV].host
})

const MONGO = {

  development: 'mongodb://USER:PASSWORD@SERVER-IP/myappdev?authSource=admin',
  test: 'mongodb://USER:PASSWORD@SERVER-IP/myapptest?authSource=admin',
  production: 'mongodb://USER:PASSWORD@SERVER-IP/myapp?authSource=admin'
}

const WEB_BASE_URL = {
  url: 'https://api.it.teithe.gr'
}

const OWASP_CONFIG = {
  allowPassphrases: true,
  maxLength: 128,
  minLength: 8,
  minPhraseLength: 25,
  minOptionalTestsToPass: 4
}

const WORDPRESS_CREDENTIALS = {
  url: 'https://www.it.teithe.gr',
  username: 'fakeusername',
  password: 'fakepassword',
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
}

const SCOPE_ACTIVATED = 1

const nodemailer = require('nodemailer')
const MAIL = nodemailer.createTransport({
  host: 'smtp.teithe.gr',
  port: 25,
  tls: {
    rejectUnauthorized: false
  }
})

module.exports = {
  MONGO,
  WEB_BASE_URL,
  WORDPRESS_CREDENTIALS,
  MAIL,
  LDAP,
  PERMISSIONS,
  LDAP_TEI,
  LDAP_CLIENT,
  OWASP_CONFIG,
  SCOPE_ACTIVATED
}
