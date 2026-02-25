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
    const user = await authService.validateSession(token)

    if (user.role !== 'service_provider') {
      return NextResponse.json(
        { error: 'Only service providers can view leads' },
        { status: 403 }
      )
    }

    const providerId = user.serviceProviderProfile!.id

    // Get provider's specialties
    const provider = await prisma.serviceProviderProfile.findUnique({
      where: { id: providerId },
    })

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    // Get available leads in provider's categories
    const availableLeads = await prisma.jobRequest.findMany({
      where: {
        category: {
          in: provider.specialties,
        },
        leadStatus: {
          in: ['available', 'viewed'],
        },
        // Exclude leads this provider already viewed
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
      take: 50,
    })

    // Get leads this provider has viewed
    const viewedLeads = await prisma.jobRequest.findMany({
      where: {
        leadViews: {
          some: {
            providerId,
          },
        },
        leadStatus: {
          not: 'accepted',
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

    // Get leads this provider won
    const wonLeads = await prisma.jobRequest.findMany({
      where: {
        acceptedBy: providerId,
      },
      include: {
        location: true,
        homeowner: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        acceptedAt: 'desc',
      },
      take: 20,
    })

    return NextResponse.json({
      available: availableLeads.map((lead) => ({
        id: lead.id,
        category: lead.category,
        propertyType: lead.propertyType,
        location: `${lead.location.city}, ${lead.location.state}`,
        preview: lead.description.substring(0, 100) + '...',
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
      won: wonLeads.map((lead) => ({
        id: lead.id,
        category: lead.category,
        propertyType: lead.propertyType,
        location: `${lead.location.city}, ${lead.location.state}`,
        customer: {
          name: `${lead.homeowner.firstName} ${lead.homeowner.lastName}`,
          phone: lead.homeowner.phoneNumber,
          email: lead.homeowner.user.email,
        },
        acceptedAt: lead.acceptedAt,
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
