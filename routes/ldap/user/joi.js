const Joi = require('joi')
const translate = require('../../../configs/ldap').elotTranslate

const objectClasses = ['itteithePerson', 'posixAccount', 'eduPerson', 'inetOrgPerson', 'organizationalPerson', 'person', 'top', 'simpleSecurityObject']

const generateCnElot = (context) => {
  try {
    return translate(context['cn;lang-el'].toLowerCase()).toUpperCase()
  }
  catch (err) {
    try {
      return translate(context['cn;lang-el'])
    } catch (err) {
      console.log(err)
      console.log('----')
      console.log('cn;lang-el')
      console.log('ERROR ON TRY CATCH - ' + context['cn;lang-el'])
      return context['cn;lang-el']
    }

  }
}
generateCnElot.description = 'generated cnElot'

const generateFathersNameElot = (context) => {
  try {
    if (context['fathersname;lang-el']) {
      return translate(context['fathersname;lang-el'].toLowerCase()).toUpperCase()
    }
    else {
      return '-'
    }
  }
  catch (err) {
    try {
      return translate(context['fathersname;lang-el'])
    } catch (err) {
      console.log(err)
      console.log('----')
      console.log('fathersname;lang-el')
      console.log('ERROR ON TRY CATCH - ' + context['fathersname;lang-el'])
      return context['fathersname;lang-el']
    }

  }

}
generateFathersNameElot.description = 'generated fathersnameElot'

const generateGivenNameElot = (context) => {
  try {
    return translate(context['givenName;lang-el'].toLowerCase()).toUpperCase()
  } catch (err) {
    try {
      return translate(context['givenName;lang-el'])
    } catch (err) {
      console.log(err)
      console.log('----')
      console.log('givenName;lang-el')
      console.log('ERROR ON TRY CATCH - ' + context['givenName;lang-el'])
      return context['givenName;lang-el']
    }

  }
}
generateGivenNameElot.description = 'generated givenNameElot'

const generateSnElot = (context) => {
  try {
    return translate(context['sn;lang-el'].toLowerCase()).toUpperCase()
  } catch (err) {
    try {
      return translate(context['sn;lang-el'])
    } catch (err) {
      console.log(err)
      console.log('----')
      console.log('sn;lang-el')
      console.log('ERROR ON TRY CATCH - ' + context['sn;lang-el'])
      return context['sn;lang-el']
    }
  }

}
generateSnElot.description = 'generated snElot'

const generateCnEl = (context) => {
  return context['givenName;lang-el'] + ' ' + context['sn;lang-el']
}
generateCnEl.description = 'generated El cn'

const generateHomeDir = (context) => {
  //return next gid
  if (context.eduPersonAffiliation == 'student') {
    return '/home/' + context.eduPersonAffiliation + '/' + context.eduPersonPrimaryAffiliation + '/' + context.regyear + '/' + context.uid
  } else {
    return '/home/' + context.eduPersonAffiliation + '/' + context.uid

  }
}
generateHomeDir.description = 'generated Gid'

const generateGroupID = (context) => {
  require('crypto').randomBytes(48, function (err, buffer) {
    let value = buffer.toString('hex')
    let hash = crypto.crypt(value, 'AXSGpfWdoLVjne')
    return '{CRYPT}' + hash
  })

}
generateGroupID.description = 'generated Password'

const updateUser = Joi.object().keys({
  attr: Joi.string().required(),
  value: Joi.string().required()
})

const addUser = Joi.object().keys({
  uid: Joi.string().required(),
  name: Joi.string().max(50).required(),
  lname: Joi.string().max(50).required(),
  type: Joi.string().required(),
  typeP: Joi.string().required(),
  scope: Joi.number().integer().required(),
  mail: Joi.string().email().required(),
  gid: Joi.number().integer().positive().required(),
  am: Joi.string().required(),
  title: Joi.string().required(),
  titleGr: Joi.string().required(),
  basedn: Joi.string().required()
})

const initializeUser = Joi.object().keys({
  objectClass: Joi.default(objectClasses),
  'cn;lang-el': Joi.string().max(30).default(generateCnEl),
  cn: Joi.string().max(30).default(generateCnElot),
  'sn;lang-el': Joi.string().max(30).required().error(new Error('Παρακαλώ επιλέξτε επώνυμο.')),
  sn: Joi.string().max(30).default(generateSnElot),
  'givenName;lang-el': Joi.string().max(30).required().error(new Error('Παρακαλώ επιλέξτε όνομα.')),
  givenName: Joi.string().max(30).default(generateGivenNameElot).optional(),
  'fathersname;lang-el': Joi.string().max(30).default('NONAME').allow(''),
  fathersname: Joi.string().max(30).default(generateFathersNameElot),
  displayName: Joi.string().max(30),
  'displayName;lang-el': Joi.string().max(30),
  description: Joi.string().max(200),
  'description;lang-el': Joi.string().max(200),
  eduPersonAffiliation: Joi.string().max(30).lowercase().error(new Error('Σφαλμα: Ο Τύπος λογαριασμού δεν υπαρχει.')),
  eduPersonPrimaryAffiliation: Joi.string().max(30).lowercase().error(new Error('Σφαλμα: Η Ιδιότητα δεν υπαρχει.')),
  eduPersonScopedAffiliation: Joi.number().integer().error(new Error('Παρακαλώ επιλέξτε δικαιώματα')),
  am: Joi.string().default('-').error(new Error('Παρακαλώ επιλέξτε AM.')),
  regyear: Joi.number().integer().default(0),
  regsem: Joi.number().integer().default(0),
  mail: Joi.string().email().error(new Error('Παρακαλώ επιλέξτε Mail.')),
  secondarymail: Joi.string().email().default('-'),
  id: Joi.number().integer(),
  uid: Joi.string().max(30).lowercase().error(new Error('Παρακαλώ επιλέξτε Όνομα Χρήστη.')),
  status: Joi.number().integer().default(0),
  sem: Joi.number().integer().default(0),
  gidNumber: Joi.number().integer().default(3000),
  uidNumber: Joi.number().integer(),
  homeDirectory: Joi.string().alphanum().default(generateHomeDir).error(new Error('errrr')),
  userPassword: Joi.string().min(8).default('{CRYPT}TSMywqBza/y3A)'),
  basedn: Joi.string().error(new Error('Σφαλμα: Το BaseDN δεν υπαρχει.')),
  title: Joi.any(),
  'title;lang-el': Joi.any(),
  telephoneNumber: Joi.any().default('0'),
  labeledURI: Joi.any().default('-'),
  loginShell: Joi.any().default('/bin/bash'),
})

module.exports = {
  addUser,
  initializeUser,
  updateUser
}
