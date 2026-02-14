import sharp from 'sharp'
import { storageService } from './storage.service'

const THUMBNAIL_WIDTH = 300
const THUMBNAIL_HEIGHT = 300

export class ThumbnailService {
  /**
   * Generate thumbnail for image
   * Requirements: 2.2
   */
  async generateThumbnail(
    imageBuffer: Buffer,
    filename: string,
    userId: string
  ): Promise<{ storageKey: string; url: string }> {
    try {
      // Generate thumbnail using sharp
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .toBuffer()

      // Upload thumbnail to storage
      const thumbnailFilename = `thumb_${filename}`
      const { storageKey, url } = await storageService.uploadFile(
        thumbnailBuffer,
        thumbnailFilename,
        'image/jpeg',
        userId
      )

      return { storageKey, url }
    } catch (error) {
      console.error('Thumbnail generation failed:', error)
      // Return empty if thumbnail generation fails (non-critical)
      return { storageKey: '', url: '' }
    }
  }

  /**
   * Check if file is an image
   */
  isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/')
  }
}

export const thumbnailService = new ThumbnailService()
