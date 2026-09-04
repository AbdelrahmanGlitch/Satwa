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

// Fields safe to hand back in a response — every route below selects this
// explicitly instead of returning the raw Mongoose document, so a hashed
// password (or an OTP hash) never leaks into a JSON response again.
const PUBLIC_USER_FIELDS = "-password -OTP -forgetPasswordOTP -__v";

// `phone` is stored AES-encrypted (see signUp/updateProfile below) — any
// response that includes it has to decrypt it first, or the caller gets
// back ciphertext instead of a phone number.
const withDecryptedPhone = (userDoc) => {
    const obj = userDoc.toObject();
    if (obj.phone) obj.phone = Decrypt(obj.phone, process.env.ENCRYPTION_KEY);
    return obj;
};

export const signUp = asyncHandler(async (req, res, next) => {
  const { name, email, password, gender, phone, cPassword } = req.body;
  if(await userModel.findOne({ email })) {
    return res.status(400).json({ message: "Email already exists" });
  }
  if(password !== cPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }
  const hashedPassword = await Hash(password, +process.env.SALT_ROUND);
  const phoneEncrypted = await Encrypt(phone, process.env.ENCRYPTION_KEY);
  const user = await userModel.create({
    name,
    email,
    password: hashedPassword,
    gender,
    phone: phoneEncrypted,
    OTP: null
  });
  eventEmiter.emit("sendEmail", {email})
  const created = await userModel.findById(user._id).select(PUBLIC_USER_FIELDS);
  return res.status(201).json({ message: "User created successfully", user: created})
})
export const confirmEmail = asyncHandler(async (req,res,next)=>{
    const {code, email} = req.body
    const user = await userModel.findOne({email, confirmed: false});
    //check email
    if(!user){
        return next(new Error('Email not exists or already verified', {cause : 409}))
    }
    //compare OTP
    const OTP = user.OTP
    if(!await compare(code , OTP)){
        return next(new Error('Confirmation code is not correct'))
    }
    await userModel.updateOne({email},{confirmed: true , $unset: {OTP: 0} })
    return res.status(200).json({message: "user confirmed successfully"})
})
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
    const publicUser = await userModel.findById(user._id).select(PUBLIC_USER_FIELDS);
    return res.status(200).json({message:"user logged in successfully", user : publicUser, token: token})
})

// Google Identity Services flow: the frontend verifies nothing itself, it
// just hands us the ID token GIS returned. We verify it server-side, then
// find-or-create the account — this is the only place a Google account is
// ever created or logged in.
export const googleSignIn = asyncHandler(async (req,res,next)=>{
    const {idToken} = req.body;
    const payload = await verifyGoogleToken(idToken);
    if(!payload?.email){
        return next(new Error("Could not verify Google account", {cause: 400}))
    }
    let user = await userModel.findOne({ $or: [{googleId: payload.sub}, {email: payload.email}] });
    if(!user){
        user = await userModel.create({
            name: payload.name || payload.email.split("@")[0],
            email: payload.email,
            provider: "google",
            googleId: payload.sub,
            avatar: payload.picture,
            confirmed: true
        })
    } else if(!user.googleId){
        // A local account already used this email — link it instead of
        // creating a duplicate.
        user.googleId = payload.sub;
        user.avatar = user.avatar || payload.picture;
        await user.save();
    }
    const token = await generateToken({
        payload: {email: user.email, id: user._id, role: user.role},
        SIGNATURE: user.role == "user" ? process.env.SIGNATURE_TOKEN_USER : process.env.SIGNATURE_TOKEN_ADMIN,
        option: {expiresIn: "1w"}
    })
    const publicUser = await userModel.findById(user._id).select(PUBLIC_USER_FIELDS);
    return res.status(200).json({message: "user logged in successfully", user: publicUser, token})
})

export const getWishlist = asyncHandler(async (req,res,next)=>{
    const user = await userModel.findById(req.user._id).populate("wishlist").select("wishlist");
    return res.status(200).json({message: "wishlist", wishlist: user.wishlist})
})
export const addToWishlist = asyncHandler(async (req,res,next)=>{
    const {productId} = req.body;
    const user = await userModel.findByIdAndUpdate(
        req.user._id,
        {$addToSet: {wishlist: productId}},
        {new: true}
    ).select("wishlist")
    return res.status(200).json({message:"Product added to the wishlist", wishlist: user.wishlist})
})
export const removeFromWishlist = asyncHandler(async (req,res,next)=>{
    const {productId} = req.params;
    const user = await userModel.findByIdAndUpdate(
        req.user._id,
        {$pull: {wishlist: productId}},
        {new: true}
    ).select("wishlist")
    return res.status(200).json({message:"Product removed from the wishlist", wishlist: user.wishlist})
})

export const updateProfile = asyncHandler(async (req,res,next)=>{
    const {name, phone, address, gender} = req.body;
    // Whitelisted explicitly — spreading req.body straight into the update
    // used to let a caller set arbitrary fields (role included). Email is
    // deliberately not accepted here — see requestEmailChange/
    // confirmEmailChange, which require re-confirming the new address.
    const update = {};
    if(name !== undefined) update.name = name;
    if(address !== undefined) update.address = address;
    if(gender !== undefined) update.gender = gender;
    if(phone !== undefined) update.phone = await Encrypt(phone, process.env.ENCRYPTION_KEY);
    const user = await userModel.findByIdAndUpdate(req.user._id, update, {new: true}).select(PUBLIC_USER_FIELDS)
    return res.status(200).json({message:"Updated", user: withDecryptedPhone(user)})
})
export const profile = asyncHandler(async (req,res,next)=>{
    const user = await userModel.findById(req.user._id).select(PUBLIC_USER_FIELDS)
    return res.status(200).json({message:"user Info", user: withDecryptedPhone(user)})
})

// Two-step, same shape as signup confirmation: request sends a code to the
// *new* address without touching the account yet; confirm applies it only
// once that code checks out. `email` itself never changes in between, so
// an unconfirmed change can't lock anyone out or leave the account
// reachable at neither address.
export const requestEmailChange = asyncHandler(async (req,res,next)=>{
    const {newEmail} = req.body;
    if(newEmail === req.user.email){
        return next(new Error("That's already your current email", {cause: 400}))
    }
    if(await userModel.findOne({email: newEmail})){
        return next(new Error("Email already in use", {cause: 409}))
    }
    const OTP = customAlphabet("123456789", 6)()
    const hash = await Hash(OTP, +process.env.SALT_ROUND)
    await userModel.findByIdAndUpdate(req.user._id, {pendingEmail: newEmail, OTP: hash})
    const htmlInner = await htmlEmail(OTP)
    const sent = await sendEmail(newEmail, "Confirm your new email", htmlInner)
    if(!sent){
        return next(new Error("Failed to send confirmation email", {cause: 500}))
    }
    return res.status(200).json({message: "Confirmation code sent to your new email"})
})

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
export const forgetPassword = asyncHandler(async (req,res,next)=>{
    const {email} = req.body
    if(!await userModel.findOne({email})){
        return next(new Error("This email doesn't have an account", {cause: 400}))
    }
    eventEmiter.emit("forgetPassword", {email})
    return res.status(200).json({message:"One Time Code Has been sent to your email"})
})
export const resetPassword = asyncHandler(async(req,res,next)=>{
    const {email, code, newPassword, cNewPassword} = req.body;
    const user = await userModel.findOne({email});
    //check email
    if(!user){
        return next(new Error('Email not exists', {cause : 409}))
    }
    //compare OTP
    const OTP = user.OTP
    if(!await compare(code , OTP)){
        return next(new Error('One time code is not correct'))
    }
    if(newPassword !== cNewPassword){
        return next(new Error("Passward and Confirm Passward are not matching!", {cause: 400}))
    }
    const hashed = await Hash(newPassword, +process.env.SALT_ROUND);
    await userModel.updateOne({email}, {password: hashed, $unset: {OTP: 0}})
    return res.status(200).json({message:"passward updated"})
})
