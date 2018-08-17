const Joi = require('joi')

const addAccTypePrimary = Joi.object().keys({
  title: Joi.any().required(),
  dec: Joi.any().default('-'),
  ptitlegr: Joi.any().required(),
  ptitle: Joi.any().required(),
  value: Joi.any().required()
})

const addAccType = Joi.object().keys({
  title_main: Joi.string().max(25).required(),
  dec_main: Joi.any().default('-'),
  value_main: Joi.string().max(25).required(),
  basedn: Joi.string().required(),
  primary: Joi.array().items(addAccTypePrimary)
})

const editAccType = Joi.object().keys({
  title_main: Joi.string().max(25),
  dec_main: Joi.any(),
  value_main: Joi.string().max(25),
  basedn: Joi.string().required(),
  primary: Joi.array().items(addAccTypePrimary)
})

const deleteAccType = Joi.object().keys({
  basedn: Joi.string().required()
})

module.exports = {
  addAccType,
  addAccTypePrimary,
  deleteAccType,
  editAccType
}
