import joi from "joi";
import { generalRoules } from "../../utils/generalRules.js";
import { shopGenderEnum } from "../../DB/models/category.model.js";

export const createCategorySchema = {
    body: joi.object({
        title: joi.string()
            .min(2)
            .max(50)
            .required()
            .messages({
                "string.min": "Title is too short",
                "string.max": "Title is too long"
            }),

        tagline: joi.string().allow(""),

        description: joi.string()
            .required(),

        gender: joi.string()
            .valid(...shopGenderEnum)
            .required()
    })
};

export const updateCategorySchema = {
    params: joi.object({
        id: generalRoules.id.required()
    }),
    body: joi.object({
        title: joi.string().min(2).max(50),
        tagline: joi.string().allow(""),
        description: joi.string(),
        gender: joi.string().valid(...shopGenderEnum)
    })
};

export const categoryIdSchema = {
    params: joi.object({
        id: generalRoules.id.required()
    })
};

export const listCategoriesSchema = {
    query: joi.object({
        gender: joi.string().valid(...shopGenderEnum),
        page: joi.number().min(1),
        limit: joi.number().min(1).max(100)
    })
};

export const getCategoryBySlugSchema = {
    params: joi.object({
        gender: joi.string().valid(...shopGenderEnum).required(),
        slug: joi.string().required()
    })
};
