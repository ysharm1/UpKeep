import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, ServiceCategory } from '@prisma/client'

const prisma = new PrismaClient()

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const category = searchParams.get('category')

    // Validate required params
    if (!lat || !lng || !category) {
      return NextResponse.json(
        { error: { message: 'Missing required parameters: lat, lng, category', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: { message: 'Invalid latitude or longitude', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = Object.values(ServiceCategory)
    if (!validCategories.includes(category as ServiceCategory)) {
      return NextResponse.json(
        { error: { message: 'Invalid category', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    // Query providers with matching specialty
    const providers = await prisma.serviceProviderProfile.findMany({
      where: {
        specialties: {
          has: category as ServiceCategory
        },
        verified: true,
        isActive: true,
        diagnosticFee: {
          not: null
        }
      },
      include: {
        user: {
          select: {
            email: true
          }
        },
        serviceArea: {
          include: {
            centerLocation: true
          }
        },
        jobRequests: {
          where: {
            status: {
              in: ['diagnostic_scheduled', 'in_progress', 'repair_approved']
            }
          },
          select: {
            id: true
          }
        }
      }
    })

    // Calculate distance and filter by service area
    const providersWithDistance = providers
      .map(provider => {
        let distance = 999999 // Default very large distance
        let inServiceArea = false

        if (provider.serviceArea?.centerLocation) {
          const centerLat = provider.serviceArea.centerLocation.latitude
          const centerLng = provider.serviceArea.centerLocation.longitude
          distance = calculateDistance(latitude, longitude, centerLat, centerLng)

          // Check if within radius
          if (provider.serviceArea.radiusMiles) {
            inServiceArea = distance <= provider.serviceArea.radiusMiles
          }
        }

        // Check if in zip code service area
        if (provider.serviceArea?.zipCodes && provider.serviceArea.zipCodes.length > 0) {
          // For now, we'll consider it in service area if they have zip codes configured
          // In production, you'd want to geocode the lat/lng to a zip code and check
          inServiceArea = true
        }

        // Calculate workload
        const activeJobsCount = provider.jobRequests.length
        const isAvailable = activeJobsCount < 3 // Consider "available" if less than 3 active jobs
        
        // Estimate response time based on workload
        let estimatedResponseHours = 4 // Default
        if (activeJobsCount === 0) estimatedResponseHours = 2
        else if (activeJobsCount === 1) estimatedResponseHours = 4
        else if (activeJobsCount === 2) estimatedResponseHours = 8
        else estimatedResponseHours = 24

        return {
          id: provider.id,
          businessName: provider.businessName,
          diagnosticFee: provider.diagnosticFee ? parseFloat(provider.diagnosticFee.toString()) : null,
          rating: provider.averageRating,
          reviewCount: provider.reviewCount,
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal
          specialties: provider.specialties,
          isVerified: provider.verified,
          profilePhotoUrl: provider.profilePhotoUrl,
          inServiceArea,
          activeJobsCount,
          isAvailable,
          estimatedResponseHours
        }
      })
      .filter(p => p.inServiceArea) // Only include providers in service area
      .sort((a, b) => {
        // Sort by: 1) availability, 2) distance, 3) rating
        if (a.isAvailable !== b.isAvailable) {
          return a.isAvailable ? -1 : 1 // Available providers first
        }
        if (Math.abs(a.distance - b.distance) > 5) {
          return a.distance - b.distance // Then by distance (if difference > 5 miles)
        }
        return b.rating - a.rating // Then by rating
      })
      .slice(0, 5) // Return top 5

    return NextResponse.json({
      providers: providersWithDistance
    })

  } catch (error) {
    console.error('[NEARBY_PROVIDERS_ERROR]', error)
    return NextResponse.json(
      { error: { message: 'Failed to fetch nearby providers', code: 'SERVER_ERROR' } },
      { status: 500 }
    )
  }
}
