import joi from "joi";
import { generalRoules } from "../../utils/generalRules.js";
export const createAdminSchema = {
        body: joi.object({
            name: generalRoules.name.required(),
            email: generalRoules.email,
            password: generalRoules.password.required(),
            cPassword: joi.string().valid(joi.ref("password")).required(),
            adminCode: joi.required()
        }).with("password", "cPassword").with("email","password")
}
export const loginSchema = {
        body: joi.object({
            email: generalRoules.email,
            password: generalRoules.password.required()
        })
}