import joi from "joi";
import { generalRoules } from "../../utils/generalRules.js";

export const createOfferSchema = {
    body: joi.object({
        newPrice: joi.number().min(0).required(),
        productId: generalRoules.id.required(),
        categoryId: generalRoules.id,
        startDate: joi.date(),
        endDate: joi.date().greater(joi.ref("startDate"))
    })
};

export const offerIdSchema = {
    params: joi.object({
        id: generalRoules.id.required()
    })
};
