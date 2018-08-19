const Joi = require('joi')

const chpw = Joi.object().keys({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().required()
})

const updateMail = Joi.object().keys({
  newMail: Joi.string().email().required()
})

const resetPassword = Joi.object().keys({
  mail: Joi.string().email().required(),
  username: Joi.string().required()
})

const resetPasswordToken = Joi.object().keys({
  token: Joi.string().required(),
  newPassword: Joi.string().required(),
  newPasswordVerify: Joi.string().required()
})

module.exports = {
  chpw,
  updateMail,
  resetPassword,
  resetPasswordToken
}
