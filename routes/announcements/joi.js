const Joi = require('joi');

const deleteAnnouncementsQuerySchema = Joi.object().keys({
    fields: Joi.object().keys({
        publisher: Joi.string(),
        _about: Joi.string()
    }).required().allow(null),
    filters: Joi.object().keys({
        _about: Joi.string(),
        start: Joi.string(),
        end: Joi.string()
    }).required().with('end', 'start').allow(null)
});

const getAnnouncementFeedSchema = Joi.object().keys({
    type: Joi.string().valid('rss', 'atom', 'json').required(),
    categoryIds: Joi.any().allow()
});

const deleteAnnouncementSchema = Joi.object().keys({
    id: Joi.required()
});

const deleteFileFromAnnouncementSchema = Joi.object().keys({
    id: Joi.required(),
    fileId: Joi.required()
});

const newAnnouncementsQuerySchema = Joi.object().keys({
    title: Joi.string().trim().min(1).max(80).required(),
    titleEn: Joi.string().trim().min(1).max(80).allow(''),
    text: Joi.string().max(12000).allow(''),
    textEn: Joi.string().max(12000).allow(''),
    about: Joi.required(),
    publisher: Joi.object().keys({
        publisherId: Joi.string(),
        publisherName: Joi.string()
    }).allow()
});

const editAnnouncementsQuerySchema = Joi.object().keys({
    title: Joi.string().trim().min(1).max(250).required(),
    titleEn: Joi.string().trim().min(1).max(250).allow(''),
    text: Joi.string().max(9000).allow(''),
    textEn: Joi.string().max(9000).allow(''),
    about: Joi.allow(),
    publisher: Joi.string(),
});

const newCategorySchema = Joi.object().keys({
    categoryTitle: Joi.string().min(1).max(60).required(),
    publicCategory: Joi.boolean().required(),
    wid: Joi.number().integer()
});

const editCategorySchemaBody = Joi.object().keys({
    name: Joi.string().min(1).max(60).required(),
    publicCategory: Joi.boolean().required(),
    wid: Joi.number().integer()
});

const editCategorySchemaParams = Joi.object().keys({
    value: Joi.string().required()
});

const registerCategoriesSchema = Joi.object().keys({
    'categoriesRegistered': Joi.required(),
    'categoriesNotRegistered': Joi.required()
});


const deleteCategorySchema = Joi.object().keys({
    id: Joi.required()
});

const getAnnouncementSchema = Joi.object().keys({
    id: Joi.required()
});

module.exports = {
    deleteAnnouncementsQuerySchema: deleteAnnouncementsQuerySchema,
    newAnnouncementsQuerySchema: newAnnouncementsQuerySchema,
    editAnnouncementsQuerySchema: editAnnouncementsQuerySchema,
    deleteAnnouncementSchema: deleteAnnouncementSchema,
    newCategorySchema: newCategorySchema,
    editCategorySchemaParams: editCategorySchemaParams,
    editCategorySchemaBody: editCategorySchemaBody,
    deleteCategorySchema: deleteCategorySchema,
    registerCategoriesSchema: registerCategoriesSchema,
    getAnnouncementSchema: getAnnouncementSchema,
    getAnnouncementFeedSchema: getAnnouncementFeedSchema,
    deleteFileFromAnnouncementSchema: deleteFileFromAnnouncementSchema
}