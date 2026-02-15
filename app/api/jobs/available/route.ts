export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    let user
    try {
      user = await authService.validateSession(token)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    if (user.role !== 'service_provider') {
      return NextResponse.json({ error: 'Only service providers can access this' }, { status: 403 })
    }

    // Get provider profile with service area
    const providerProfile = await prisma.serviceProviderProfile.findUnique({
      where: { userId: user.id },
      include: {
        serviceArea: {
          include: {
            centerLocation: true,
          },
        },
      },
    })

    if (!providerProfile) {
      // Return empty jobs list instead of error if profile not fully set up
      return NextResponse.json({
        jobs: [],
        count: 0,
        message: 'Complete your provider profile to see available jobs',
      })
    }

    // Find jobs that:
    // 1. Are in "submitted" or "pending_match" status (not yet claimed)
    // 2. Match provider's specialties (or show all if no specialties set)
    // 3. Are in provider's service area (for now, just show all - will add location filtering later)
    const whereClause: any = {
      status: {
        in: ['submitted', 'pending_match'],
      },
      serviceProviderId: null, // Not yet assigned to anyone
    }

    // Only filter by specialties if provider has any set
    if (providerProfile.specialties && providerProfile.specialties.length > 0) {
      whereClause.category = {
        in: providerProfile.specialties,
      }
    }

    const availableJobs = await prisma.jobRequest.findMany({
      where: whereClause,
      include: {
        location: true,
        homeowner: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20, // Limit to 20 most recent jobs
    })

    // Format response
    const formattedJobs = availableJobs.map(job => ({
      id: job.id,
      category: job.category,
      description: job.description,
      status: job.status,
      location: job.location,
      createdAt: job.createdAt,
      homeowner: {
        email: job.homeowner.user.email,
      },
    }))

    return NextResponse.json({
      jobs: formattedJobs,
      count: formattedJobs.length,
    })
  } catch (error: any) {
    console.error('Available jobs error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch available jobs' },
      { status: 500 }
    )
  }
}
