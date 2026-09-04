import joi from "joi";
import { generalRoules } from "../../utils/generalRules.js";

export const checkoutSchema = {
    body: joi.object({
        items: joi.array().items(joi.object({
            productId: generalRoules.id.required(),
            quantity: joi.number().min(1).required()
        })).min(1).required(),
        phone: joi.string().required(),
        address: joi.string().required()
    })
};

export const orderIdSchema = {
    params: joi.object({
        id: generalRoules.id.required()
    })
};

export const updateOrderStatusSchema = {
    params: joi.object({
        id: generalRoules.id.required()
    }),
    body: joi.object({
        status: joi.string().valid("pending","processing","shipped","delivered","cancelled").required()
    })
};

export const listOrdersSchema = {
    query: joi.object({
        status: joi.string().valid("pending","processing","shipped","delivered","cancelled"),
        page: joi.number().min(1),
        limit: joi.number().min(1).max(100)
    })
};
