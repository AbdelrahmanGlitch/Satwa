import CryptoJS from 'crypto-js';
export const Encrypt = (phone, SECRET_KEY = process.env.ENCRYPTION_KEY )=>{
    return CryptoJS.AES.encrypt(phone, SECRET_KEY).toString()
}