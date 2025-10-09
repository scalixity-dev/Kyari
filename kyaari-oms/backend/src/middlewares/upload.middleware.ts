import multer from 'multer';
import { s3BucketConfig } from '../config/s3.config';

// Configure multer to use memory storage (files will be streamed to S3)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check MIME type
  if (s3BucketConfig.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

// Create multer upload middleware
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: s3BucketConfig.maxFileSize, // 10 MB
  },
});

// Single file upload middleware
export const uploadSingle = (fieldName: string = 'file') => upload.single(fieldName);

// Multiple files upload middleware
export const uploadMultiple = (fieldName: string = 'files', maxCount: number = 5) =>
  upload.array(fieldName, maxCount);
