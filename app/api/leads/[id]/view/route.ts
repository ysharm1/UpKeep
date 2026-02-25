export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'
import { chargeViewFee } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { sendLeadViewConfirmation } from '@/lib/sms'

export async function POST(
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
      },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Check if lead is still available
    if (lead.leadStatus === 'accepted') {
      return NextResponse.json(
        { error: 'Lead already accepted by another provider' },
        { status: 400 }
      )
    }

    // Charge view fee based on property type
    const result = await chargeViewFee(
      user.serviceProviderProfile!.id,
      leadId,
      lead.propertyType as any
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Send SMS confirmation
    await sendLeadViewConfirmation(
      user.serviceProviderProfile!.phoneNumber,
      user.serviceProviderProfile!.businessName,
      `${lead.homeowner.firstName} ${lead.homeowner.lastName}`,
      lead.homeowner.phoneNumber
    )

    // Return full lead details
    return NextResponse.json({
      message: 'Lead unlocked successfully',
      chargeId: result.chargeId,
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
      },
    })
  } catch (error: any) {
    console.error('View lead error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to view lead' },
      { status: 500 }
    )
  }
}
