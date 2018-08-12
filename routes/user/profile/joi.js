const Joi = require('joi')

const socialMediaExtr = Joi.object().keys({
  name: Joi.string().required(),
  url: Joi.string().uri().optional().required()
})

const profileUpdate = Joi.object().keys({
  'displayName;lang-el': Joi.string().allow(''),
  labeledURI: Joi.string().allow(''),
  telephoneNumber: Joi.string().min(10).max(10).label('Τηλέφωνο').allow('').error(new Error('Το πεδίο Τηλέφωνο θα πρέπει να είναι 10 αριθμοί.')),
  secondarymail: Joi.string().email().optional().allow(''),
  description: Joi.string().allow(''),
  'description;lang-el': Joi.string().allow(''),
  scientificField: Joi.string().label('Επιστημονικό πεδιο').allow(''),
  facebook: Joi.string().uri().optional().allow(''),
  twitter: Joi.string().uri().optional().allow(''),
  github: Joi.string().uri().optional().allow(''),
  googlePlus: Joi.string().uri().optional().allow(''),
  linkedIn: Joi.string().uri().optional().allow(''),
  socialMediaExtra:  Joi.array().items(socialMediaExtr)
})

module.exports = {
  profileUpdate: profileUpdate
}