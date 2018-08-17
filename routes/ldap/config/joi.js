const Joi = require('joi')

const updateConfig = Joi.object().keys({
  data: Joi.number().positive().required()
})

module.exports = {
  updateConfig
}
