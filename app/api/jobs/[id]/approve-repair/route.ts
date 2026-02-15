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
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { paymentMethodId } = body

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Missing required field: paymentMethodId' },
        { status: 400 }
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
        assignedProvider: {
          include: {
            serviceProviderProfile: true,
            user: true
          }
        },
        repairQuote: true
      }
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Verify user is the homeowner
    if (job.homeowner.userId !== decoded.userId) {
      return NextResponse.json(
        { error: 'Not authorized to approve this quote' },
        { status: 403 }
      )
    }

    // Check if repair quote exists
    if (!job.repairQuote) {
      return NextResponse.json(
        { error: 'No repair quote found for this job' },
        { status: 404 }
      )
    }

    // Check if quote is already approved or declined
    if (job.repairQuote.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Quote already ${job.repairQuote.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    const repairAmount = parseFloat(job.repairQuote.totalAmount.toString())

    // Create Stripe PaymentIntent with payment method (authorize only, don't capture)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(repairAmount * 100), // Convert to cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
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

    // Send email notification to provider
    try {
      const emailService = require('@/lib/notifications/email.service').emailService
      await emailService.sendQuoteApproved(
        job.assignedProvider.user.email,
        job.assignedProvider.serviceProviderProfile?.businessName || 'Provider',
        job.homeowner.user.name || 'Homeowner',
        job.description,
        repairAmount
      )
    } catch (emailError) {
      console.error('[EMAIL_ERROR]', emailError)
      // Don't fail the approval if email fails
    }

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
        { error: 'Your card was declined' },
        { status: 400 }
      )
    }

    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Invalid payment information' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to approve repair quote' },
      { status: 500 }
    )
  }
}
