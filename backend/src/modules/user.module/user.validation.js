import joi from "joi";
import { generalRoules } from "../../utils/generalRules.js";

export const signUpSchema = {
    body: joi.object({
        name: generalRoules.name.required(),
        email: generalRoules.email,
        password: generalRoules.password.required(),
        cPassword: joi.string().valid(joi.ref("password")).required(),
        gender: joi.string().valid("Male","Female").required(),
        phone: joi.string().regex(/^01[0125][0-9]{8}$/).required()
    }).with("password", "cPassword").with("email","password")
};
export const updateProfileSchema = {
    body: joi.object({
        name: generalRoules.name,
        gender: joi.string().valid("Male","Female"),
        phone: joi.string().regex(/^01[0125][0-9]{8}$/),
        address: joi.string()
    })
};
export const requestEmailChangeSchema = {
    body: joi.object({
        newEmail: generalRoules.email.required()
    })
};
export const confirmEmailChangeSchema = {
    body: joi.object({
        code: joi.required()
    })
};
export const changePasswordSchema = {
    body: joi.object({
        currentPassword: joi.string().required(),
        newPassword: generalRoules.password.required(),
        cNewPassword: generalRoules.password.required()
    })
};
export const signInSchema = {
  body: joi.object({
        email: generalRoules.email,
        password: generalRoules.password.required()
    })
}
export const googleSignInSchema = {
  body: joi.object({
        idToken: joi.string().required()
    })
}
export const resetPasswordSchema = {
  body: joi.object({
        email: generalRoules.email,
        newPassword: generalRoules.password.required(),
        cNewPassword: generalRoules.password.required(),
        code: joi.required()
    })
}
export const confirmEmailSchema = {
  body: joi.object({
        email: generalRoules.email,
        code: joi.required()
    })
}
export const addToWishlistSchema = {
  body: joi.object({
        productId: generalRoules.id.required()
    })
}
export const removeFromWishlistSchema = {
  params: joi.object({
        productId: generalRoules.id.required()
    })
}
export const forgetPasswordSchema = {
  body: joi.object({
        email: generalRoules.email
    })
}
