import { customAlphabet } from "nanoid";
import { asyncHandler } from "../../utils/errorHandling.js";
import { Hash } from "../../utils/hash/hash.js";
import { eventEmiter } from "../../utils/sendEmail.js";
import { sendEmail } from "../../services/sendEmails.js";
import { htmlEmail } from "../../utils/htmlEmail.js";
import userModel from './../../DB/models/user.model.js';
import { Encrypt } from './../../utils/encry/encrypt.js';
import { Decrypt } from './../../utils/encry/decrypt.js';
import { compare } from './../../utils/hash/compere.js';
import { generateToken } from './../../utils/token/generateToken.js';
import { verifyGoogleToken } from '../../utils/google/verifyGoogleToken.js';

// ignored information shouldn't be displayed to the user when returning user data.
const PUBLIC_USER_FIELDS = "-password -OTP -forgetPasswordOTP -__v";

// updated information reformating for user display
const updatedUser = (user) => {
    const updatedInfo = user.toObject();
    if (updatedInfo.phone) updatedInfo.phone = Decrypt(updatedInfo.phone, process.env.ENCRYPTION_KEY);
    return updatedInfo;
};

// ------------------------ signUp ------------------------------

export const signUp = asyncHandler(async (req, res, next) => {
  const { name, email, password, gender, phone, cPassword } = req.body;
  if(await userModel.findOne({ email })) {
    return next(new Error("Email already exists", { cause: 409 }));
  }
  if(password !== cPassword) {
    return next(new Error("Passwords do not match", { cause: 400 }));
  }
  const hashedPassword = await Hash(password, +process.env.SALT_ROUND);
  const phoneEncrypted = await Encrypt(phone, process.env.ENCRYPTION_KEY);
  const user = await userModel.create({
    name,
    email,
    password: hashedPassword,
    gender,
    phone: phoneEncrypted
  });
  eventEmiter.emit("sendEmail", {email})
  const createdUser = await userModel.findById(user._id).select(PUBLIC_USER_FIELDS);
  return res.status(201).json({ message: "User created successfully", user: createdUser})
})

// ------------------------ confirmEmail ------------------------------

export const confirmEmail = asyncHandler(async (req,res,next)=>{
    const {code, email} = req.body
    const user = await userModel.findOne({email, confirmed: false});
    if(!user){
        return next(new Error('Email not exists or already verified', {cause : 409}))
    }
    //compare OTP
    const OTP = user.OTP
    if(!await compare(code , OTP)){
        return next(new Error('Confirmation code is not correct', {cause: 400}))
    }
    await userModel.updateOne({email},{confirmed: true , $unset: {OTP: 0} })
    return res.status(200).json({message: "user confirmed successfully"})
})

// ------------------------ SignIn ------------------------------

export const SignIn = asyncHandler(async (req,res,next)=>{
    const {email, password} = req.body;
    const user = await userModel.findOne({email})
    if(!user){
        return next(new Error("this email doesn't have an account",{cause: 400}))
    }
    if(user.provider !== "local"){
        return next(new Error(`This email signs in with ${user.provider}`, {cause: 400}))
    }
    if(!user.confirmed){
        return next(new Error("Please check you email first to confirm your email", {cause: 400}))
    }
    const hashedPassword = await compare(password, user.password)
    if(!hashedPassword){
        return next(new Error("Email or Password is not correct",{cause: 400}))
    }
    const token = await generateToken({
        payload: {email, id: user._id, role: user.role},
        SIGNATURE: user.role == "user" ? process.env.SIGNATURE_TOKEN_USER : process.env.SIGNATURE_TOKEN_ADMIN,
        option: {expiresIn: "1w"}
    })
    const createdUser = await userModel.findOne({email}).select(PUBLIC_USER_FIELDS)
    return res.status(200).json({message:"user logged in successfully", user : createdUser, token: token})
})

// ------------------------ googleSignIn ------------------------------

export const googleSignIn = asyncHandler(async (req,res,next)=>{
    const {idToken} = req.body;
    const GoogleData = await verifyGoogleToken(idToken);
    if(!GoogleData?.email){
        return next(new Error("Could not verify Google account", {cause: 400}))
    }
    let user = await userModel.findOne({ $or: [{googleId: GoogleData.sub}, {email: GoogleData.email}] });
    if(!user){
        user = await userModel.create({
            name: GoogleData.name || GoogleData.email.split("@")[0],
            email: GoogleData.email,
            provider: "google",
            googleId: GoogleData.sub,
            avatar: GoogleData.picture,
            confirmed: true
        })
    } else if(!user.googleId){
        user.googleId = GoogleData.sub;
        user.avatar = user.avatar || GoogleData.picture;
        await user.save();
    }
    const token = await generateToken({
        payload: {email: user.email, id: user._id, role: user.role},
        SIGNATURE: user.role == "user" ? process.env.SIGNATURE_TOKEN_USER : process.env.SIGNATURE_TOKEN_ADMIN,
        option: {expiresIn: "1w"}
    })
    const createdUser = await userModel.findById(user._id).select(PUBLIC_USER_FIELDS)
    return res.status(200).json({message: "user logged in successfully", user: createdUser, token})
})

// ------------------------ getWishlist ------------------------------

export const getWishlist = asyncHandler(async (req,res,next)=>{
    // (.populate("wishlist")) is used to replace the aray of strings "wishlist" to an array of objects "products" so it include data instaid of just products names 
    const user = await userModel.findById(req.user._id).populate("wishlist").select("wishlist");
    return res.status(200).json({message: "wishlist", wishlist: user.wishlist})
})

// ------------------------ addToWishlist ------------------------------

export const addToWishlist = asyncHandler(async (req,res,next)=>{
    const {productId} = req.body;
    const user = await userModel.findByIdAndUpdate(
        req.user._id,
        {$addToSet: {wishlist: productId}},
        {new: true}
    ).select("wishlist")
    return res.status(200).json({message:"Product added to the wishlist", wishlist: user.wishlist})
})

// ------------------------ removeFromWishlist ------------------------------

export const removeFromWishlist = asyncHandler(async (req,res,next)=>{
    const {productId} = req.params;
    const user = await userModel.findByIdAndUpdate(
        req.user._id,
        {$pull: {wishlist: productId}},
        {new: true}
    ).select("wishlist")
    return res.status(200).json({message:"Product removed from the wishlist", wishlist: user.wishlist})
})

// ------------------------ updateProfile ------------------------------

export const updateProfile = asyncHandler(async (req,res,next)=>{
    const {name, phone, address, gender} = req.body;
    const update = {};
    if(name !== undefined) update.name = name;
    if(address !== undefined) update.address = address;
    if(gender !== undefined) update.gender = gender;
    if(phone !== undefined) update.phone = await Encrypt(phone, process.env.ENCRYPTION_KEY);
    const user = await userModel.findByIdAndUpdate(req.user._id, update, {new: true}).select(PUBLIC_USER_FIELDS)
    return res.status(200).json({message:"Updated", user: updatedUser(user)})
})

// ------------------------ profile ------------------------------

export const profile = asyncHandler(async (req,res,next)=>{
    const user = await userModel.findById(req.user._id).select(PUBLIC_USER_FIELDS)
    return res.status(200).json({message:"user Info", user : updatedUser(user)})
})

// ------------------------ requestEmailChange ------------------------------

export const requestEmailChange = asyncHandler(async (req,res,next)=>{
    const {newEmail} = req.body;
    if(newEmail === req.user.email){
        return next(new Error("That's already your current email", {cause: 400}))
    }
    if(await userModel.findOne({email: newEmail})){
        return next(new Error("Email already in use", {cause: 409}))
    }
    eventEmiter.emit("changeEmail", {email: newEmail})
    await userModel.findByIdAndUpdate(req.user._id, {$set: {pendingEmail: newEmail}});
    return res.status(200).json({message: "Confirmation code sent to your new email"})
})

// ------------------------ confirmEmailChange ------------------------------

export const confirmEmailChange = asyncHandler(async (req,res,next)=>{
    const {code} = req.body;
    const user = await userModel.findById(req.user._id);
    if(!user?.pendingEmail){
        return next(new Error("No pending email change", {cause: 400}))
    }
    if(!await compare(code, user.OTP)){
        return next(new Error("Confirmation code is not correct", {cause: 400}))
    }
    const newEmail = user.pendingEmail;
    await userModel.findByIdAndUpdate(req.user._id, {
        $set: {email: newEmail},
        $unset: {pendingEmail: 1, OTP: 1}
    });
    return res.status(200).json({message: "Email updated", email: newEmail})
})

// ------------------------ changePassword ------------------------------

export const changePassword = asyncHandler(async (req,res,next)=>{
    const {currentPassword, newPassword, cNewPassword} = req.body;
    if(newPassword !== cNewPassword){
        return next(new Error("New password and confirm password do not match", {cause: 400}))
    }
    const user = await userModel.findById(req.user._id);
    if(user.provider !== "local"){
        return next(new Error(`This account signs in with ${user.provider} and has no password to change`, {cause: 400}))
    }
    if(!await compare(currentPassword, user.password)){
        return next(new Error("Current password is not correct", {cause: 400}))
    }
    const hashed = await Hash(newPassword, +process.env.SALT_ROUND);
    await userModel.findByIdAndUpdate(req.user._id, {password: hashed});
    return res.status(200).json({message: "Password updated"})
})

// ------------------------ forgetPassword ------------------------------

export const forgetPassword = asyncHandler(async (req,res,next)=>{
    const {email} = req.body
    if(!await userModel.findOne({email})){
        return next(new Error("This email doesn't have an account", {cause: 400}))
    }
    eventEmiter.emit("forgetPassword", {email})
    return res.status(200).json({message:"One Time Code Has been sent to your email"})
})

// ------------------------ resetPassword ------------------------------

export const resetPassword = asyncHandler(async(req,res,next)=>{
    const {email, code, newPassword, cNewPassword} = req.body;
    const user = await userModel.findOne({email});
    if(!user){
        return next(new Error('Email not exists', {cause : 409}))
    }
    const OTP = user.OTP
    if(!await compare(code , OTP)){
        return next(new Error('One time code is not correct', {cause: 400}))
    }
    if(newPassword !== cNewPassword){
        return next(new Error("Passward and Confirm Passward are not matching!", {cause: 400}))
    }
    const hashed = await Hash(newPassword, +process.env.SALT_ROUND);
    await userModel.updateOne({email}, {password: hashed, $unset: {OTP: 0}})
    return res.status(200).json({message:"passward updated"})
})
