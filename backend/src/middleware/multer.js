import multer from 'multer';
import { nanoid } from 'nanoid';
import fs from 'fs'
export const fileTypes = {
    image : ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
}

function imageFileFilter(req, file, cb) {
    if(fileTypes.image.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type! Only images are allowed.'), false);
    }
}

// 5MB/image — multer has no cap by default, which would otherwise let a
// single request upload arbitrarily large files straight through to
// Cloudinary.
const limits = { fileSize: 5 * 1024 * 1024 };

export const multerLocal = (customValidation = [], custompath= "generals")=>{
    const fullPath = `uploads/${custompath}`
    if(!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, {recursive: true})
    }
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, fullPath)
        },
        filename: function (req, file, cb) {
            cb(null, nanoid(4) + '-' + file.originalname)
        }
    })
    const upload = multer({ storage, fileFilter: imageFileFilter, limits });
    return upload;
}
export const multerCloudinary = (customValidation = [])=>{
    const storage = multer.diskStorage({});
    const upload = multer({ storage, fileFilter: imageFileFilter, limits });
    return upload;
}
