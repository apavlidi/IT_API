const Joi = require('joi')

const pithiaUser = Joi.object().keys({
  usernamePithia: Joi.string().trim().required(),
  passwordPithia: Joi.string().required(),

})

const tokenUser = Joi.object().keys({
  token: Joi.string().required(),
  mail: Joi.string().email().required(),

})

const updateMailReg = Joi.object().keys({
  newMail: Joi.string().email().required()
})

const updatePassReg = Joi.object().keys({
  password: Joi.string().required(),
})

module.exports = {
  pithiaUser,
  tokenUser,
  updateMailReg,
  updatePassReg
}