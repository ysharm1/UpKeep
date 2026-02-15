import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyAuth } from '@/lib/auth/auth.middleware'
import Stripe from 'stripe'

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
})

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json(
        { error: { message: 'Authentication required', code: 'AUTH_REQUIRED' } },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { jobId, providerId } = body

    if (!jobId || !providerId) {
      return NextResponse.json(
        { error: { message: 'Missing required fields: jobId, providerId', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    // Get job request
    const job = await prisma.jobRequest.findUnique({
      where: { id: jobId },
      include: {
        homeowner: {
          include: {
            user: true
          }
        }
      }
    })

    if (!job) {
      return NextResponse.json(
        { error: { message: 'Job request not found', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Verify user owns this job
    if (job.homeowner.userId !== authResult.userId) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'FORBIDDEN' } },
        { status: 403 }
      )
    }
    // Verify user owns this job
    if (job.homeowner.userId !== decoded.userId) {
      return NextResponse.json(
        { error: { message: 'Not authorized to book this job', code: 'FORBIDDEN' } },
        { status: 403 }
      )
    }

    // Get provider's diagnostic fee
    const provider = await prisma.serviceProviderProfile.findUnique({
      where: { id: providerId }
    })

    if (!provider) {
      return NextResponse.json(
        { error: { message: 'Provider not found', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    if (!provider.diagnosticFee) {
      return NextResponse.json(
        { error: { message: 'Provider has not set diagnostic fee', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    const diagnosticFee = parseFloat(provider.diagnosticFee.toString())

    // Create Stripe PaymentIntent (authorize only, don't capture)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(diagnosticFee * 100), // Convert to cents
      currency: 'usd',
      capture_method: 'manual', // Don't capture immediately
      metadata: {
        jobRequestId,
        providerId,
        type: 'diagnostic'
      }
    })

    // Update job request
    const updatedJob = await prisma.jobRequest.update({
      where: { id: jobRequestId },
      data: {
        serviceProviderId: providerId,
        diagnosticPaymentIntentId: paymentIntent.id,
        status: 'diagnostic_scheduled'
      }
    })

    console.log('[BOOKING_CREATED]', {
      jobId: jobRequestId,
      providerId,
      diagnosticFee,
      paymentIntentId: paymentIntent.id
    })

    return NextResponse.json({
      success: true,
      booking: {
        jobId: updatedJob.id,
        providerId,
        diagnosticFee,
        paymentIntentId: paymentIntent.id,
        status: updatedJob.status
      }
    })

  } catch (error: any) {
    console.error('[BOOKING_ERROR]', error)
    
    // Handle Stripe errors
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { error: { message: 'Your card was declined', code: 'CARD_DECLINED' } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: { message: 'Failed to create booking', code: 'SERVER_ERROR' } },
      { status: 500 }
    )
  }
}
