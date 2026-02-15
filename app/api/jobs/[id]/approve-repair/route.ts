import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth/auth.middleware'
import Stripe from 'stripe'

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: { message: 'Authentication required', code: 'AUTH_REQUIRED' } },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json(
        { error: { message: 'Invalid token', code: 'AUTH_REQUIRED' } },
        { status: 401 }
      )
    }

    // Get job request
    const job = await prisma.jobRequest.findUnique({
      where: { id: params.id },
      include: {
        homeowner: {
          include: {
            user: true
          }
        },
        repairQuote: true
      }
    })

    if (!job) {
      return NextResponse.json(
        { error: { message: 'Job not found', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Verify user is the homeowner
    if (job.homeowner.userId !== decoded.userId) {
      return NextResponse.json(
        { error: { message: 'Not authorized to approve this quote', code: 'FORBIDDEN' } },
        { status: 403 }
      )
    }

    // Check if repair quote exists
    if (!job.repairQuote) {
      return NextResponse.json(
        { error: { message: 'No repair quote found for this job', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Check if quote is already approved or declined
    if (job.repairQuote.status !== 'PENDING') {
      return NextResponse.json(
        { error: { message: `Quote already ${job.repairQuote.status.toLowerCase()}`, code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    const repairAmount = parseFloat(job.repairQuote.totalAmount.toString())

    // Create Stripe PaymentIntent for repair amount (authorize only, don't capture)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(repairAmount * 100), // Convert to cents
      currency: 'usd',
      capture_method: 'manual', // Don't capture immediately
      metadata: {
        jobRequestId: params.id,
        quoteId: job.repairQuote.id,
        type: 'repair'
      }
    })

    // Update job request with repair payment intent
    await prisma.jobRequest.update({
      where: { id: params.id },
      data: {
        repairPaymentIntentId: paymentIntent.id,
        status: 'repair_approved'
      }
    })

    // Update repair quote status
    await prisma.repairQuote.update({
      where: { id: job.repairQuote.id },
      data: {
        status: 'APPROVED'
      }
    })

    console.log('[REPAIR_APPROVED]', {
      jobId: params.id,
      quoteId: job.repairQuote.id,
      repairAmount,
      paymentIntentId: paymentIntent.id
    })

    return NextResponse.json({
      success: true,
      paymentIntentId: paymentIntent.id,
      totalAmount: repairAmount
    })

  } catch (error: any) {
    console.error('[APPROVE_REPAIR_ERROR]', error)
    
    // Handle Stripe errors
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { error: { message: 'Your card was declined', code: 'CARD_DECLINED' } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: { message: 'Failed to approve repair quote', code: 'SERVER_ERROR' } },
      { status: 500 }
    )
  }
}
