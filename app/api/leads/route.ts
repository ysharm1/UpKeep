export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'
import { prisma } from '@/lib/prisma'
import { calculateDistance } from '@/lib/geocoding'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await authService.validateSession(token)

    if (user.role !== 'service_provider') {
      return NextResponse.json(
        { error: 'Only service providers can view leads' },
        { status: 403 }
      )
    }

    const providerId = user.serviceProviderProfile!.id

    // Get provider's specialties and location
    const provider = await prisma.serviceProviderProfile.findUnique({
      where: { id: providerId },
    })

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    const providerHasLocation = provider.latitude && provider.longitude
    const serviceRadius = provider.serviceRadius || 25

    // Get available leads in provider's categories
    const availableLeads = await prisma.jobRequest.findMany({
      where: {
        category: {
          in: provider.specialties,
        },
        leadStatus: {
          in: ['available', 'viewed'],
        },
        // Exclude leads this provider already purchased
        leadViews: {
          none: {
            providerId,
          },
        },
      },
      include: {
        location: true,
        leadViews: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    })

    // Filter by geographic distance if provider has location set
    const filteredLeads = providerHasLocation
      ? availableLeads.filter((lead) => {
          if (!lead.latitude || !lead.longitude) return true // Show leads without coords
          const distance = calculateDistance(
            { latitude: provider.latitude!, longitude: provider.longitude! },
            { latitude: lead.latitude, longitude: lead.longitude }
          )
          return distance <= serviceRadius
        })
      : availableLeads

    // Get leads this provider has purchased
    const viewedLeads = await prisma.jobRequest.findMany({
      where: {
        leadViews: {
          some: {
            providerId,
          },
        },
      },
      include: {
        location: true,
        leadViews: true,
        homeowner: {
          include: {
            user: true,
          },
        },
        mediaFiles: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      available: filteredLeads.map((lead) => ({
        id: lead.id,
        category: lead.category,
        propertyType: lead.propertyType,
        location: `${lead.location.city}, ${lead.location.state}`,
        preview: lead.description.substring(0, 100) + (lead.description.length > 100 ? '...' : ''),
        createdAt: lead.createdAt,
        viewCount: lead.viewCount,
        competitorCount: lead.leadViews.length,
      })),
      viewed: viewedLeads.map((lead) => ({
        id: lead.id,
        category: lead.category,
        propertyType: lead.propertyType,
        description: lead.description,
        location: {
          street: lead.location.street,
          city: lead.location.city,
          state: lead.location.state,
          zipCode: lead.location.zipCode,
        },
        customer: {
          name: `${lead.homeowner.firstName} ${lead.homeowner.lastName}`,
          phone: lead.homeowner.phoneNumber,
          email: lead.homeowner.user.email,
        },
        photos: lead.mediaFiles.map((f) => f.url),
        createdAt: lead.createdAt,
        viewCount: lead.viewCount,
        leadStatus: lead.leadStatus,
      })),
    })
  } catch (error: any) {
    console.error('Get leads error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get leads' },
      { status: 500 }
    )
  }
}
