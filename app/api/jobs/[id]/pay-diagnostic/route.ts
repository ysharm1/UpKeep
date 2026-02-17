export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

const DIAGNOSTIC_FEE = 85.00 // $85
const PLATFORM_FEE_PERCENTAGE = 0.15 // 15%

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

    // Verify user is a homeowner
    if (user.role !== 'homeowner') {
      return NextResponse.json({ error: 'Only homeowners can pay for diagnostics' }, { status: 403 })
    }

    // Get job request
    const jobRequest = await prisma.jobRequest.findUnique({
      where: { id: params.id },
      include: {
        homeowner: true,
        serviceProvider: true,
      },
    })

    if (!jobRequest) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Verify homeowner owns this job
    if (jobRequest.homeowner.userId !== user.id) {
      return NextResponse.json({ error: 'Not authorized for this job' }, { status: 403 })
    }

    // Verify job has a provider assigned
    if (!jobRequest.serviceProviderId) {
      return NextResponse.json({ error: 'No provider assigned to this job' }, { status: 400 })
    }

    // Verify job is in correct status (matched or accepted)
    if (jobRequest.status !== 'matched' && jobRequest.status !== 'accepted') {
      return NextResponse.json({ error: 'Job is not ready for diagnostic payment' }, { status: 400 })
    }

    // If payment intent exists, check if it's already completed
    if (jobRequest.diagnosticPaymentIntentId) {
      const existingIntent = await stripe.paymentIntents.retrieve(jobRequest.diagnosticPaymentIntentId)
      
      if (existingIntent.status === 'succeeded') {
        return NextResponse.json({ error: 'Diagnostic payment already completed' }, { status: 400 })
      }
      
      // Payment exists but not completed - return existing client secret
      return NextResponse.json({
        clientSecret: existingIntent.client_secret,
        amount: existingIntent.amount / 100,
      })
    }

    // Check if a payment record already exists (from previous attempt)
    const existingPayment = await prisma.payment.findUnique({
      where: { jobId: jobRequest.id },
    })

    if (existingPayment) {
      // Return existing payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(existingPayment.stripePaymentIntentId)
      
      if (paymentIntent.status === 'succeeded') {
        return NextResponse.json({ error: 'Diagnostic payment already completed' }, { status: 400 })
      }
      
      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        amount: existingPayment.amount,
      })
    }

    // Calculate fees
    const amount = DIAGNOSTIC_FEE
    const platformFee = amount * PLATFORM_FEE_PERCENTAGE
    const providerAmount = amount - platformFee

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      payment_method_types: ['card', 'cashapp', 'affirm'],
      metadata: {
        jobId: jobRequest.id,
        type: 'diagnostic',
        homeownerId: jobRequest.homeownerId,
        providerId: jobRequest.serviceProviderId,
      },
      description: `Diagnostic fee for ${jobRequest.category} service`,
    })

    // Update job with payment intent ID
    await prisma.jobRequest.update({
      where: { id: params.id },
      data: {
        diagnosticPaymentIntentId: paymentIntent.id,
      },
    })

    // Create or update payment record
    await prisma.payment.upsert({
      where: { jobId: jobRequest.id },
      create: {
        jobId: jobRequest.id,
        stripePaymentIntentId: paymentIntent.id,
        amount,
        platformFee,
        providerAmount,
        status: 'pending',
      },
      update: {
        stripePaymentIntentId: paymentIntent.id,
        amount,
        platformFee,
        providerAmount,
        status: 'pending',
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount,
    })
  } catch (error: any) {
    console.error('Create diagnostic payment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
      { status: 500 }
    )
  }
}
