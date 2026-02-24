export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'
import { chargeAcceptFee } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import {
  sendLeadAcceptanceConfirmation,
  sendLeadAcceptedNotification,
} from '@/lib/sms'

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
        { error: 'Only service providers can accept leads' },
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
        leadViews: {
          include: {
            provider: {
              include: {
                user: true,
              },
            },
          },
        },
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

    // Charge $50 accept fee
    const result = await chargeAcceptFee(user.serviceProviderProfile!.id, leadId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Send SMS confirmation to winner
    await sendLeadAcceptanceConfirmation(
      user.serviceProviderProfile!.phoneNumber,
      user.serviceProviderProfile!.businessName,
      `${lead.homeowner.firstName} ${lead.homeowner.lastName}`,
      lead.homeowner.phoneNumber,
      lead.homeowner.user.email
    )

    // Notify other vendors who viewed the lead
    const otherVendors = lead.leadViews.filter(
      (view) => view.providerId !== user.serviceProviderProfile!.id
    )

    for (const view of otherVendors) {
      await sendLeadAcceptedNotification(
        view.provider.phoneNumber,
        view.provider.businessName,
        lead.category
      )
    }

    return NextResponse.json({
      message: 'Lead accepted successfully',
      chargeId: result.chargeId,
      customer: {
        name: `${lead.homeowner.firstName} ${lead.homeowner.lastName}`,
        phone: lead.homeowner.phoneNumber,
        email: lead.homeowner.user.email,
      },
    })
  } catch (error: any) {
    console.error('Accept lead error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to accept lead' },
      { status: 500 }
    )
  }
}
