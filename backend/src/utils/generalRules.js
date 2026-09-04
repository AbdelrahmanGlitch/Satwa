import { Types } from "mongoose"
import joi from 'joi';
export const customId = (value, helper)=>{
    let data = Types.ObjectId.isValid(value)
    return data ? value : helper.message("id is not valid")
}

export const generalRoules = {
    objectId: joi.string().custom(customId),
    email: joi.string().email(),
    // Letters (incl. accented), spaces, hyphens and apostrophes — real
    // names routinely have all four ("John Doe", "Anne-Marie", "O'Neil"),
    // which `alphanum()` used to reject outright.
    name: joi.string().min(3).max(50).pattern(/^[\p{L}][\p{L}'-]*(?: [\p{L}'-]+)*$/u).messages({
        "string.pattern.base": "Name may only contain letters, spaces, hyphens and apostrophes"
    }),
    password: joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/),
    id: joi.string().custom(customId),
    headers: joi.object({
        authorization: joi.string().required(),
        'cache-control': joi.string(),
        'postman-token': joi.string(),
        'content-type': joi.string(),
        'content-length': joi.string(),
        host: joi.string(),
        'user-agent': joi.string(),
        accept: joi.string(),
        'accept-encoding': joi.string(),
        connection: joi.string()
    })
}