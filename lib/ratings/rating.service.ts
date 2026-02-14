import { PrismaClient, Rating } from '@prisma/client'

const prisma = new PrismaClient()

export interface RatingSubmission {
  score: number
  review?: string
}

export class RatingService {
  /**
   * Submit rating
   * Requirements: 6.1, 6.2, 6.3, 6.7
   */
  async submitRating(
    jobId: string,
    reviewerId: string,
    revieweeId: string,
    ratingData: RatingSubmission
  ): Promise<Rating> {
    const { score, review } = ratingData

    // Validate score
    if (score < 1 || score > 5) {
      throw new Error('Rating score must be between 1 and 5')
    }

    // Validate review length
    if (review && review.length > 500) {
      throw new Error('Review must not exceed 500 characters')
    }

    // Check if job is completed
    const job = await prisma.jobRequest.findUnique({
      where: { id: jobId },
    })

    if (!job || job.status !== 'completed') {
      throw new Error('Can only rate completed jobs')
    }

    // Check 7-day window
    const completedDate = job.updatedAt
    const daysSinceCompletion = (Date.now() - completedDate.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceCompletion > 7) {
      throw new Error('Rating window has expired (7 days after completion)')
    }

    // Create rating
    const rating = await prisma.rating.create({
      data: {
        jobId,
        reviewerId,
        revieweeId,
        score,
        review,
        flagged: false,
      },
    })

    // Update average rating
    await this.updateAverageRating(revieweeId)

    return rating
  }

  /**
   * Get ratings for user
   * Requirements: 6.5
   */
  async getRatingsForUser(userId: string): Promise<Rating[]> {
    const ratings = await prisma.rating.findMany({
      where: { revieweeId: userId },
      orderBy: { createdAt: 'desc' },
    })

    return ratings
  }

  /**
   * Get average rating
   * Requirements: 3.4, 6.4
   */
  async getAverageRating(userId: string): Promise<number> {
    const ratings = await prisma.rating.findMany({
      where: { revieweeId: userId },
    })

    if (ratings.length === 0) return 0

    const sum = ratings.reduce((acc, rating) => acc + rating.score, 0)
    return sum / ratings.length
  }

  /**
   * Update average rating in profile
   */
  private async updateAverageRating(userId: string): Promise<void> {
    const avgRating = await this.getAverageRating(userId)
    const reviewCount = await prisma.rating.count({
      where: { revieweeId: userId },
    })

    // Try to update homeowner profile
    const homeownerProfile = await prisma.homeownerProfile.findUnique({
      where: { id: userId },
    })

    if (homeownerProfile) {
      await prisma.homeownerProfile.update({
        where: { id: userId },
        data: { averageRating: avgRating },
      })
    }

    // Try to update service provider profile
    const providerProfile = await prisma.serviceProviderProfile.findUnique({
      where: { id: userId },
    })

    if (providerProfile) {
      await prisma.serviceProviderProfile.update({
        where: { id: userId },
        data: {
          averageRating: avgRating,
          reviewCount,
        },
      })
    }
  }

  /**
   * Check if user can submit rating
   * Requirements: 6.7
   */
  async canSubmitRating(jobId: string, userId: string): Promise<boolean> {
    const existingRating = await prisma.rating.findUnique({
      where: {
        jobId_reviewerId: {
          jobId,
          reviewerId: userId,
        },
      },
    })

    return !existingRating
  }
}

export const ratingService = new RatingService()
