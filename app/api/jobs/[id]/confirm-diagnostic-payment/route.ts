export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

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

    const { paymentIntentId } = await request.json()

    // Get job request
    const jobRequest = await prisma.jobRequest.findUnique({
      where: { id: params.id },
      include: {
        homeowner: true,
      },
    })

    if (!jobRequest) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Verify homeowner owns this job
    if (jobRequest.homeowner.userId !== user.id) {
      return NextResponse.json({ error: 'Not authorized for this job' }, { status: 403 })
    }

    // Verify payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    // Update job status to accepted (payment received)
    await prisma.jobRequest.update({
      where: { id: params.id },
      data: {
        status: 'accepted',
      },
    })

    // Update payment record
    await prisma.payment.update({
      where: {
        stripePaymentIntentId: paymentIntentId,
      },
      data: {
        status: 'captured',
        capturedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: 'Payment confirmed successfully',
      status: 'accepted',
    })
  } catch (error: any) {
    console.error('Confirm diagnostic payment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}
