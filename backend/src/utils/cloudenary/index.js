import dotenv from 'dotenv';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
dotenv.config({ path: path.resolve('.env') });

cloudinary.config({
    cloud_name: process.env.cloudName,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret
});

export default cloudinary;
