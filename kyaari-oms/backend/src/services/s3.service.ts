import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, s3BucketConfig } from '../config/s3.config';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { logger } from '../utils/logger';

export interface UploadResult {
  key: string;
  url: string;
  presignedUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

// Type definition for Multer file
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

class S3Service {
  private bucketChecked = false;

  /**
   * Ensure bucket exists, create if it doesn't
   */
  private async ensureBucketExists(): Promise<void> {
    if (this.bucketChecked) return;

    try {
      // Check if bucket exists
      await s3Client.send(new HeadBucketCommand({
        Bucket: s3BucketConfig.bucketName
      }));
      
      this.bucketChecked = true;
      logger.info('S3 bucket exists', { bucket: s3BucketConfig.bucketName });
    } catch (error: unknown) {
      const err = error as { name?: string };
      if (err.name === 'NotFound' || err.name === 'NoSuchBucket') {
        // Bucket doesn't exist, create it
        logger.info('S3 bucket not found, creating...', { bucket: s3BucketConfig.bucketName });
        
        try {
          await s3Client.send(new CreateBucketCommand({
            Bucket: s3BucketConfig.bucketName
          }));
          
          this.bucketChecked = true;
          logger.info('S3 bucket created successfully', { bucket: s3BucketConfig.bucketName });
        } catch (createError) {
          logger.error('Failed to create S3 bucket', { createError, bucket: s3BucketConfig.bucketName });
          throw new Error(`Failed to create S3 bucket: ${s3BucketConfig.bucketName}`);
        }
      } else {
        logger.error('Failed to check S3 bucket', { error, bucket: s3BucketConfig.bucketName });
        throw error;
      }
    }
  }

  /**
   * Upload a file to S3
   */
  async uploadFile(
    file: MulterFile,
    folder: string = 'dispatch-proofs'
  ): Promise<UploadResult> {
    try {
      // Ensure bucket exists
      await this.ensureBucketExists();

      // Generate unique file key
      const fileExtension = path.extname(file.originalname);
      const uniqueFileName = `${uuidv4()}${fileExtension}`;
      const key = `${folder}/${uniqueFileName}`;

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: s3BucketConfig.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      });

      await s3Client.send(command);

      // Generate URLs
      const url = `https://${s3BucketConfig.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      const presignedUrl = await this.getPresignedUrl(key);

      return {
        key,
        url,
        presignedUrl,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  /**
   * Generate presigned URL for file access
   */
  async getPresignedUrl(key: string, expiresIn?: number): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: s3BucketConfig.bucketName,
        Key: key,
      });

      const presignedUrl = await getSignedUrl(
        s3Client,
        command,
        { expiresIn: expiresIn || s3BucketConfig.presignedUrlExpiry }
      );

      return presignedUrl;
    } catch (error) {
      console.error('Presigned URL generation error:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: s3BucketConfig.bucketName,
        Key: key,
      });

      await s3Client.send(command);
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error('Failed to delete file from S3');
    }
  }

  /**
   * Check if file exists in S3
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: s3BucketConfig.bucketName,
        Key: key,
      });

      await s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Upload buffer content directly to S3 (for generated files)
   */
  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    folder: string = 'generated-files'
  ): Promise<UploadResult> {
    try {
      // Ensure bucket exists
      await this.ensureBucketExists();

      const key = `${folder}/${fileName}`;

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: s3BucketConfig.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        Metadata: {
          originalName: fileName,
          uploadedAt: new Date().toISOString(),
          generated: 'true'
        },
      });

      await s3Client.send(command);

      // Generate URLs
      const url = `https://${s3BucketConfig.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      const presignedUrl = await this.getPresignedUrl(key);

      return {
        key,
        url,
        presignedUrl,
        fileName,
        fileSize: buffer.length,
        mimeType,
      };
    } catch (error) {
      console.error('S3 buffer upload error:', error);
      throw new Error('Failed to upload buffer to S3');
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: MulterFile): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > s3BucketConfig.maxFileSize) {
      return {
        valid: false,
        error: `File size ${file.size} exceeds maximum allowed size of ${s3BucketConfig.maxFileSize} bytes`,
      };
    }

    // Check MIME type
    if (!s3BucketConfig.allowedMimeTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: `File type ${file.mimetype} is not allowed. Allowed types: ${s3BucketConfig.allowedMimeTypes.join(', ')}`,
      };
    }

    return { valid: true };
  }
}

export default new S3Service();
