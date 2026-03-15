export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const leadId = params.id
    const providerId = user.serviceProviderProfile!.id

    // Get the lead
    const lead = await prisma.jobRequest.findUnique({
      where: { id: leadId },
      include: {
        homeowner: {
          include: {
            user: true,
          },
        },
        location: true,
        mediaFiles: true,
        leadViews: {
          where: {
            providerId,
          },
        },
      },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Check if provider has viewed this lead
    const hasViewed = lead.leadViews.length > 0

    if (!hasViewed) {
      // Return preview only
      return NextResponse.json({
        lead: {
          id: lead.id,
          category: lead.category,
          propertyType: lead.propertyType,
          description: lead.description,
          location: {
            city: lead.location.city,
            state: lead.location.state,
            zipCode: lead.location.zipCode,
            street: '', // Hidden until viewed
          },
          createdAt: lead.createdAt,
          viewCount: lead.viewCount,
          leadStatus: lead.leadStatus,
          hasViewed: false,
          photos: [], // Hidden until viewed
        },
      })
    }

    // Return full details
    return NextResponse.json({
      lead: {
        id: lead.id,
        category: lead.category,
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
        hasViewed: true,
      },
    })
  } catch (error: any) {
    console.error('Get lead error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get lead' },
      { status: 500 }
    )
  }
}
