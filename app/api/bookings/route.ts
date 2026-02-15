export const dynamic = 'force-dynamic'
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
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { jobId, providerId, scheduledDate, paymentMethodId } = body

    if (!jobId || !providerId || !scheduledDate || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, providerId, scheduledDate, paymentMethodId' },
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
        { error: 'Job request not found' },
        { status: 404 }
      )
    }

    // Verify user owns this job
    if (job.homeowner.userId !== authResult.userId) {
      return NextResponse.json(
        { error: 'Not authorized to book this job' },
        { status: 403 }
      )
    }

    // Get provider's diagnostic fee
    const provider = await prisma.serviceProviderProfile.findUnique({
      where: { id: providerId },
      include: {
        user: true
      }
    })

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    if (!provider.diagnosticFee) {
      return NextResponse.json(
        { error: 'Provider has not set diagnostic fee' },
        { status: 400 }
      )
    }

    const diagnosticFee = parseFloat(provider.diagnosticFee.toString())

    // Create Stripe PaymentIntent with payment method (authorize only, don't capture)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(diagnosticFee * 100), // Convert to cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      capture_method: 'manual', // Don't capture immediately
      metadata: {
        jobRequestId: jobId,
        providerId,
        type: 'diagnostic'
      }
    })

    // Update job request with scheduled date and payment intent
    const updatedJob = await prisma.jobRequest.update({
      where: { id: jobId },
      data: {
        serviceProviderId: providerId,
        diagnosticPaymentIntentId: paymentIntent.id,
        scheduledDate: new Date(scheduledDate),
        status: 'diagnostic_scheduled'
      }
    })

    // Send email notification to provider
    try {
      const emailService = require('@/lib/notifications/email.service').emailService
      await emailService.sendBookingConfirmation(
        provider.user.email,
        provider.businessName || 'Provider',
        job.homeowner.user.name || 'Homeowner',
        job.description,
        new Date(scheduledDate),
        diagnosticFee
      )
    } catch (emailError) {
      console.error('[EMAIL_ERROR]', emailError)
      // Don't fail the booking if email fails
    }

    console.log('[BOOKING_CREATED]', {
      jobId,
      providerId,
      diagnosticFee,
      scheduledDate,
      paymentIntentId: paymentIntent.id
    })

    return NextResponse.json({
      success: true,
      booking: {
        jobId: updatedJob.id,
        providerId,
        diagnosticFee,
        scheduledDate: updatedJob.scheduledDate,
        paymentIntentId: paymentIntent.id,
        status: updatedJob.status
      }
    })

  } catch (error: any) {
    console.error('[BOOKING_ERROR]', error)
    
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
      { error: error.message || 'Failed to create booking' },
      { status: 500 }
    )
  }
}
