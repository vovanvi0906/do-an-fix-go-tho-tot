import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'jofvpmc1',
  api_key: process.env.CLOUDINARY_API_KEY || '459158974861395',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'VEkVhsep2FPy0ZSwhj1o-qOmZyg',
});

export const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'fixgo/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'fill' }],
  },
});

export { cloudinary };
