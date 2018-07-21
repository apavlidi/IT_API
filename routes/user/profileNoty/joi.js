const Joi = require('joi')

const enableNotySub = Joi.object().keys({
  browserFp: Joi.string().required(),
  auth: Joi.string().required(),
  p256dh: Joi.string().required(),
  endpoint: Joi.string().required()
})

const disableNotySub = Joi.object().keys({
  browserFp: Joi.string().required(),
  all: Joi.string().valid('true').allow()
})

module.exports = {
  enableNotySub,
  disableNotySub
}