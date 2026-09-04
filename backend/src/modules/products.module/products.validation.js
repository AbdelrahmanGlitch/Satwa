import joi from "joi";
import { generalRoules } from "../../utils/generalRules.js";
import { shopGenderEnum } from "../../DB/models/category.model.js";

const notesSchema = joi.object({
    top: joi.array().items(joi.string()),
    heart: joi.array().items(joi.string()),
    base: joi.array().items(joi.string())
});

export const createProductSchema = {
    body: joi.object({
        name: joi.string().min(2).max(80).required(),
        tagline: joi.string().allow(""),
        description: joi.string().required(),
        price: joi.number().min(0).required(),
        compareAtPrice: joi.number().min(0),
        gender: joi.string().valid(...shopGenderEnum).required(),
        collections: joi.array().items(joi.string()).min(1).required(),
        notes: notesSchema,
        volumeMl: joi.number().min(0),
        stockQuantity: joi.number().min(0),
        bestSeller: joi.boolean(),
        isNew: joi.boolean()
    })
};

export const updateProductSchema = {
    params: joi.object({
        id: generalRoules.id.required()
    }),
    body: joi.object({
        name: joi.string().min(2).max(80),
        tagline: joi.string().allow(""),
        description: joi.string(),
        price: joi.number().min(0),
        compareAtPrice: joi.number().min(0).allow(null),
        gender: joi.string().valid(...shopGenderEnum),
        collections: joi.array().items(joi.string()).min(1),
        notes: notesSchema,
        volumeMl: joi.number().min(0),
        stockQuantity: joi.number().min(0),
        bestSeller: joi.boolean(),
        isNew: joi.boolean(),
        // public_ids of existing images to drop, alongside any new files
        removeImages: joi.array().items(joi.string())
    })
};

export const productIdSchema = {
    params: joi.object({
        id: generalRoules.id.required()
    })
};

export const getProductBySlugSchema = {
    params: joi.object({
        slug: joi.string().required()
    })
};

export const getProductByIdSchema = {
    params: joi.object({
        id: generalRoules.id.required()
    })
};

export const getProductsByIdsSchema = {
    body: joi.object({
        ids: joi.array().items(generalRoules.id).min(1).required()
    })
};

export const listProductsSchema = {
    query: joi.object({
        gender: joi.string().valid(...shopGenderEnum),
        collection: joi.string(),
        bestSeller: joi.boolean(),
        isNew: joi.boolean(),
        onSale: joi.boolean(),
        search: joi.string(),
        page: joi.number().min(1),
        limit: joi.number().min(1).max(100)
    })
};
