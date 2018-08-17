const Joi = require('joi')

const addGroup = Joi.object().keys({
  cn: Joi.string().required()
})

const deleteGroup = Joi.object().keys({
  dn: Joi.string().required()
})

module.exports = {
  addGroup,
  deleteGroup
}
