import { ServiceProviderProfile, ServiceCategory } from '@prisma/client'
import { prisma } from '../prisma'

export interface ServiceProviderMatch {
  provider: ServiceProviderProfile
  matchScore: number
  distance: number
  estimatedResponseTime: string
}

export class MatchingService {
  /**
   * Find matching service providers for a job request
   * Requirements: 4.1, 4.2, 4.3
   */
  async findMatches(
    jobRequestId: string
  ): Promise<ServiceProviderMatch[]> {
    const jobRequest = await prisma.jobRequest.findUnique({
      where: { id: jobRequestId },
      include: {
        location: true,
      },
    })

    if (!jobRequest) {
      throw new Error('Job request not found')
    }

    // Find providers with matching specialty and service area
    const providers = await prisma.serviceProviderProfile.findMany({
      where: {
        verified: true,
        specialties: {
          has: jobRequest.category,
        },
      },
      include: {
        user: true,
        serviceArea: {
          include: {
            centerLocation: true,
          },
        },
      },
    })

    // Filter by service area and calculate match scores
    const matches: ServiceProviderMatch[] = []

    for (const provider of providers) {
      if (!provider.serviceArea) continue

      // Check if job location is in provider's service area
      const inServiceArea = this.isInServiceArea(
        jobRequest.location,
        provider.serviceArea
      )

      if (inServiceArea) {
        const distance = this.calculateDistance(
          jobRequest.location.latitude,
          jobRequest.location.longitude,
          provider.serviceArea.centerLocation!.latitude,
          provider.serviceArea.centerLocation!.longitude
        )

        const matchScore = this.calculateMatchScore(
          provider.averageRating,
          distance,
          provider.reviewCount
        )

        matches.push({
          provider,
          matchScore,
          distance,
          estimatedResponseTime: '2-4 hours',
        })
      }
    }

    // Sort by match score (rating-based ranking)
    matches.sort((a, b) => b.matchScore - a.matchScore)

    // Return top 5 matches
    return matches.slice(0, 5)
  }

  private isInServiceArea(location: any, serviceArea: any): boolean {
    // Check zip code match
    if (serviceArea.zipCodes && serviceArea.zipCodes.includes(location.zipCode)) {
      return true
    }

    // Check radius match
    if (serviceArea.radiusMiles && serviceArea.centerLocation) {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        serviceArea.centerLocation.latitude,
        serviceArea.centerLocation.longitude
      )
      return distance <= serviceArea.radiusMiles
    }

    return false
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959 // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  private calculateMatchScore(rating: number, distance: number, reviewCount: number): number {
    // Weights: rating (0.5), distance (0.3), response time/reviews (0.2)
    const ratingScore = (rating / 5) * 0.5
    const distanceScore = Math.max(0, (1 - distance / 50)) * 0.3
    const reviewScore = Math.min(reviewCount / 50, 1) * 0.2
    return ratingScore + distanceScore + reviewScore
  }
}

export const matchingService = new MatchingService()
