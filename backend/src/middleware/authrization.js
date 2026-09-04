import jwt from 'jsonwebtoken';
import userModel from '../DB/models/user.model.js';
import adminModel from '../DB/models/admin.model.js';
import { asyncHandler } from '../utils/errorHandling.js';

export const roles = {user : "user", admin: "admin"}

// Token prefix decides both which secret verifies the token and which
// collection the payload's `id` is looked up in — a "bearer" token is
// always a User, an "admin" token is always an Admin. Mixing these up is
// exactly the bug this used to have (every token, admin included, was
// looked up in the User collection).
export const authentication = asyncHandler(async (req,res,next)=>{
            const {authorization} = req.headers
            if(!authorization){
                return next(new Error("Token Not Found", {cause: 401}))
            }
            const [prefix, token] = authorization.split(" ")
            if(!prefix || !token){
                return next(new Error("Token Not Found", {cause: 401}))
            }
            let SIGNATURE_TOKEN = undefined;
            let model = undefined;
            if(prefix == "admin") {
                SIGNATURE_TOKEN = process.env.SIGNATURE_TOKEN_ADMIN
                model = adminModel
            } else if(prefix == "bearer") {
                SIGNATURE_TOKEN = process.env.SIGNATURE_TOKEN_USER
                model = userModel
            } else {
                return next(new Error("Invalid Token prefix", {cause: 401}))
            }
            let decoded;
            try {
                decoded = jwt.verify(token, SIGNATURE_TOKEN)
            } catch (err) {
                return next(new Error("Invalid or expired token", {cause: 401}))
            }
            if(!decoded?.id){
                return next(new Error("InValid Token Payload", {cause: 401}))
            }
            const account = await model.findOne({_id: decoded.id})
            if(!account){
                return next(new Error("Invalied Token", {cause: 401}))
            }
            req.user = account
            next()
        })
export const authorization = (accessRoles = []) => {
    return asyncHandler(async (req,res,next)=>{
            const user = req.user;
            if(!accessRoles.includes(user.role)){
                return next(new Error("Access Denied", {cause: 403}))
            }
            next()
        })
    }
