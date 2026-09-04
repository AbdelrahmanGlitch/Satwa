import adminModel from "../../DB/models/admin.model.js";
import { asyncHandler } from "../../utils/errorHandling.js";
import { Hash } from "../../utils/hash/hash.js";
import { compare } from "../../utils/hash/compere.js";
import { generateToken } from "../../utils/token/generateToken.js";

const PUBLIC_ADMIN_FIELDS = "-password -__v";

export const createAdmin = asyncHandler(async(req,res,next)=>{
    const {name, email, password, cPassword, adminCode} = req.body;
    if(await adminModel.findOne({email})){
        return next(new Error("email already exist"))
    }
    if(adminCode !== process.env.ADMIN_CODE){
        return next(new Error("The admin code is not correct"))
    }
    const hash = await Hash(password, +process.env.SALT_ROUND)
    const admin = await adminModel.create({
        name,
        email,
        password : hash
    })
    const created = await adminModel.findById(admin._id).select(PUBLIC_ADMIN_FIELDS);
    return res.status(200).json({message:"Admin Created Successfully", admin: created})
})
export const login = asyncHandler(async(req,res,next)=>{
    const {email, password} = req.body;
    const admin = await adminModel.findOne({email})
    if(!admin){
        return next(new Error("email doesn't exist"))
    }
    const match = await compare(password, admin.password)
    if(!match){
        return next(new Error("Email or Password is not correct"))
    }
    const token = await generateToken({
        payload: {email, id: admin._id, role: admin.role},
        SIGNATURE: process.env.SIGNATURE_TOKEN_ADMIN,
        option : {expiresIn: "1w"}
    })
    return res.status(200).json({message:"logged in successfully", token})
})
