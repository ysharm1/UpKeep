import { PrismaClient, MediaContext, MediaFile } from '@prisma/client'
import { storageService } from './storage.service'
import { thumbnailService } from './thumbnail.service'

const prisma = new PrismaClient()

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png']
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime']
const MAX_FILE_SIZE_JOB_REQUEST = 50 * 1024 * 1024 // 50MB
const MAX_FILE_SIZE_MESSAGE = 10 * 1024 * 1024 // 10MB

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export class MediaService {
  /**
   * Validate media file
   * Requirements: 2.2, 7.5
   */
  validateMedia(
    file: { size: number; type: string },
    context: MediaContext
  ): ValidationResult {
    const errors: string[] = []

    // Check file type
    const acceptedTypes = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES]
    if (!acceptedTypes.includes(file.type)) {
      errors.push(
        `Invalid file type. Accepted types: JPEG, PNG, MP4, MOV. Got: ${file.type}`
      )
    }

    // Check file size based on context
    const maxSize =
      context === MediaContext.message
        ? MAX_FILE_SIZE_MESSAGE
        : MAX_FILE_SIZE_JOB_REQUEST

    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024)
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
      errors.push(
        `File size exceeds maximum of ${maxSizeMB}MB. File size: ${fileSizeMB}MB`
      )
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Upload media file
   * Requirements: 2.2, 2.3, 7.5
   */
  async uploadMedia(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
    fileSize: number,
    userId: string,
    context: MediaContext,
    jobRequestId?: string
  ): Promise<MediaFile> {
    // Validate file
    const validation = this.validateMedia({ size: fileSize, type: mimeType }, context)

    if (!validation.valid) {
      throw new Error(`File validation failed: ${validation.errors.join(', ')}`)
    }

    // Upload to cloud storage
    const { storageKey, url } = await storageService.uploadFile(
      fileBuffer,
      filename,
      mimeType,
      userId
    )

    // Generate thumbnail for images
    let thumbnailUrl: string | undefined
    if (thumbnailService.isImage(mimeType)) {
      const thumbnail = await thumbnailService.generateThumbnail(
        fileBuffer,
        filename,
        userId
      )
      thumbnailUrl = thumbnail.url || undefined
    }

    // Create database record
    const mediaFile = await prisma.mediaFile.create({
      data: {
        userId,
        jobRequestId,
        filename,
        mimeType,
        sizeBytes: fileSize,
        storageKey,
        url,
        thumbnailUrl,
        context,
      },
    })

    return mediaFile
  }

  /**
   * Get media file URL
   * Requirements: 2.3
   */
  async getMediaUrl(mediaId: string): Promise<string> {
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id: mediaId },
    })

    if (!mediaFile) {
      throw new Error('Media file not found')
    }

    // Generate fresh signed URL
    const url = await storageService.getSignedUrl(mediaFile.storageKey)

    return url
  }

  /**
   * Delete media file
   */
  async deleteMedia(mediaId: string, userId: string): Promise<void> {
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id: mediaId },
    })

    if (!mediaFile) {
      throw new Error('Media file not found')
    }

    // Verify ownership
    if (mediaFile.userId !== userId) {
      throw new Error('Unauthorized to delete this file')
    }

    // Delete from cloud storage
    await storageService.deleteFile(mediaFile.storageKey)

    // Delete database record
    await prisma.mediaFile.delete({
      where: { id: mediaId },
    })
  }

  /**
   * Get media files for job request
   * Requirements: 2.3
   */
  async getMediaForJobRequest(jobRequestId: string): Promise<MediaFile[]> {
    const mediaFiles = await prisma.mediaFile.findMany({
      where: { jobRequestId },
      orderBy: { uploadedAt: 'asc' },
    })

    return mediaFiles
  }
}

export const mediaService = new MediaService()
