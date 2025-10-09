import { S3Client } from '@aws-sdk/client-s3';

// S3 Configuration
export const s3Config = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
};

export const s3BucketConfig = {
  bucketName: process.env.AWS_S3_BUCKET_NAME || 'kyaari-dispatch-proofs',
  presignedUrlExpiry: parseInt(process.env.S3_PRESIGNED_URL_EXPIRY || '900', 10), // 15 minutes default
  maxFileSize: 10 * 1024 * 1024, // 10 MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
  ],
};

// Create S3 Client instance
export const s3Client = new S3Client(s3Config);
