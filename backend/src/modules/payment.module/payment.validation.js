import joi from "joi";

export const confirmPaymentSchema = {
    body: joi.object({
        sessionToken: joi.string().required(),
        outcome: joi.string().valid("success","fail").required()
    })
};
