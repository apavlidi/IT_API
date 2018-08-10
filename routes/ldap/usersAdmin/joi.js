const Joi = require('joi')

const importUpdateUsers = Joi.object().keys({
  type: Joi.string().required(),
  typeP: Joi.string().required(),
  gid: Joi.number().integer().positive().required(),
  title: Joi.string().required(),
  titleGr: Joi.string().required(),
  basedn: Joi.string().required()
})

module.exports = {
  importUpdateUsers,
}