const Joi = require('joi')

const getNotificationsUser = Joi.object().keys({
  limit: Joi.number().min(0).integer().allow()
})

module.exports = {
  getNotificationsUser,
}
