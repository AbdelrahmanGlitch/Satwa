
import { EventEmitter } from 'events';
import { sendEmail } from './../services/sendEmails.js';
import { htmlEmail } from './htmlEmail.js';
import { Hash } from './hash/hash.js';
import { customAlphabet } from 'nanoid';
import userModel from './../DB/models/user.model.js';
export const eventEmiter = new EventEmitter()

eventEmiter.on("sendEmail", async (data)=>{
    const {email} = data
    const OTP = customAlphabet("123456789", 6)()
    const htmlInner = await htmlEmail(OTP)
    const hash = await Hash(OTP, +process.env.SALT_ROUND)
        await userModel.findOneAndUpdate({email, confirmed: false}, {$set: {OTP: hash}}, {new: true});
    const emailSender = await sendEmail(email, "One Time Password", `${htmlInner}`)
    // These listeners run after the controller has already responded, so
    // there is no `next` to hand a failure to — logging is the only way a
    // failed OTP delivery becomes visible instead of looking like success.
    if(!emailSender){
        console.error(`Failed to send confirmation code to ${email}`)
    }
})
// for reseting password
eventEmiter.on("forgetPassword", async(data)=>{
    const {email} = data
    const OTP = customAlphabet("123456789", 6)()
    const htmlInner = await htmlEmail(OTP)
    const hash = await Hash(OTP, +process.env.SALT_ROUND)
        await userModel.findOneAndUpdate({email}, {$set: {OTP: hash}}, {new: true});
    const emailSender = await sendEmail(email, "Password Reset Code", `${htmlInner}`)
    if(!emailSender){
        console.error(`Failed to send password-reset code to ${email}`)
    }
})
// for changing email
eventEmiter.on("changeEmail", async(data)=>{
    const {email} = data
    const OTP = customAlphabet("123456789", 6)()
    const htmlInner = await htmlEmail(OTP)
    const hash = await Hash(OTP, +process.env.SALT_ROUND)
        await userModel.findOneAndUpdate({email}, {$set: {OTP: hash}}, {new: true});
    const emailSender = await sendEmail(email, "Email Change Code", `${htmlInner}`)
    if(!emailSender){
        console.error(`Failed to send email-change code to ${email}`)
    }
})
