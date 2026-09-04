import { Router } from "express";
import * as US from './user.service.js';
import { validation } from './../../middleware/validation.js';
import * as UV from './user.validation.js';
import { authentication, authorization, roles } from './../../middleware/authrization.js';

const userRouter = Router();

userRouter.post("/signUp",validation(UV.signUpSchema),US.signUp)
userRouter.post("/confirmEmail",validation(UV.confirmEmailSchema),US.confirmEmail)
userRouter.post("/signIn",validation(UV.signInSchema),US.SignIn)
userRouter.post("/google",validation(UV.googleSignInSchema),US.googleSignIn)

userRouter.get("/wishlist",authentication,authorization([roles.user]),US.getWishlist)
userRouter.post("/wishlist",validation(UV.addToWishlistSchema),authentication,authorization([roles.user]),US.addToWishlist)
userRouter.delete("/wishlist/:productId",validation(UV.removeFromWishlistSchema),authentication,authorization([roles.user]),US.removeFromWishlist)

userRouter.get("/profile",authentication, authorization([roles.user]) ,US.profile)
userRouter.patch("/updateProfile",validation(UV.updateProfileSchema),authentication,authorization([roles.user]),US.updateProfile)
userRouter.post("/change-email",validation(UV.requestEmailChangeSchema),authentication,authorization([roles.user]),US.requestEmailChange)
userRouter.post("/confirm-email-change",validation(UV.confirmEmailChangeSchema),authentication,authorization([roles.user]),US.confirmEmailChange)
userRouter.patch("/change-password",validation(UV.changePasswordSchema),authentication,authorization([roles.user]),US.changePassword)

userRouter.post("/forget-password",validation(UV.forgetPasswordSchema),US.forgetPassword)
userRouter.post("/resetPassword",validation(UV.resetPasswordSchema),US.resetPassword)

export default userRouter;
