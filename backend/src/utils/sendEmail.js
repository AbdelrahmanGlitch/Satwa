
import { EventEmitter } from 'events';
import { sendEmail } from './../services/sendEmails.js';
import { htmlEmail } from './htmlEmail.js';

import { Hash } from './hash/hash.js';
import { customAlphabet } from 'nanoid';
import userModel from './../DB/models/user.model.js';
export const eventEmiter = new EventEmitter()

// These run outside any request/response cycle (they're event-emitter
// callbacks fired-and-forgotten from the signUp/forgetPassword
// controllers, which have already responded to the client by the time
// this runs) — there's no `next` in scope to hand a failure to, and
// calling one that doesn't exist used to crash the entire process
// (an uncaught ReferenceError) every time email delivery failed, e.g. bad
// SMTP credentials. Logging is the correct failure mode here.
eventEmiter.on("sendEmail", async (data)=>{
    const {email} = data
    const OTP = customAlphabet("123456789", 6)()
    const htmlInner = await htmlEmail(OTP)
    const hash = await Hash(OTP, +process.env.SALT_ROUND)
    await userModel.findOneAndUpdate({email, confirmed: false}, {OTP: hash}, {new: true});
    const emailSender = await sendEmail(email, "One Time Password", `${htmlInner}` )
    if(!emailSender){
        console.error(`Failed to send confirmation email to ${email}`)
    }
})
eventEmiter.on("forgetPassword", async(data)=>{
    const {email} = data
    const OTP = customAlphabet("123456789", 6)()
    const htmlInner = await htmlEmail(OTP)
    const hash = await Hash(OTP, +process.env.SALT_ROUND)
    await userModel.findOneAndUpdate({email}, {$set: {OTP: hash}}, {new: true});
    const emailSender = await sendEmail(email, "One Time Code", `${htmlInner}`)
    if(!emailSender){
        console.error(`Failed to send password-reset code to ${email}`)
    }
})
