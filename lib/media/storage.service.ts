import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.CLOUD_STORAGE_BUCKET || 'upkeep-dev'
const SIGNED_URL_EXPIRY = 3600 // 1 hour in seconds

export class StorageService {
  /**
   * Upload file to cloud storage
   * Requirements: 2.2, 2.3
   */
  async uploadFile(
    file: Buffer,
    filename: string,
    mimeType: string,
    userId: string
  ): Promise<{ storageKey: string; url: string }> {
    const fileExtension = filename.split('.').pop()
    const storageKey = `${userId}/${randomUUID()}.${fileExtension}`

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: storageKey,
      Body: file,
      ContentType: mimeType,
    })

    await s3Client.send(command)

    // Generate signed URL for accessing the file
    const url = await this.getSignedUrl(storageKey)

    return { storageKey, url }
  }

  /**
   * Get signed URL for file access
   * Requirements: 2.3
   */
  async getSignedUrl(storageKey: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: storageKey,
    })

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: SIGNED_URL_EXPIRY,
    })

    return url
  }

  /**
   * Delete file from cloud storage
   */
  async deleteFile(storageKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: storageKey,
    })

    await s3Client.send(command)
  }

  /**
   * Get file from cloud storage
   */
  async getFile(storageKey: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: storageKey,
    })

    const response = await s3Client.send(command)
    const stream = response.Body as any
    
    return Buffer.from(await stream.transformToByteArray())
  }
}

export const storageService = new StorageService()
