export const dynamic = 'force-dynamic'
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
        serviceProvider: {
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

    // Verify user is the assigned provider
    if (!job.serviceProvider || job.serviceProvider.userId !== decoded.userId) {
      return NextResponse.json(
        { error: { message: 'Not authorized to complete this job', code: 'FORBIDDEN' } },
        { status: 403 }
      )
    }

    // Check if already completed
    if (job.status === 'completed') {
      return NextResponse.json(
        { error: { message: 'Job already completed', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    // Check if repair payment intent exists
    if (!job.repairPaymentIntentId) {
      return NextResponse.json(
        { error: { message: 'No repair payment to capture', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    // Capture the repair payment intent
    const capturedRepairIntent = await stripe.paymentIntents.capture(job.repairPaymentIntentId)

    // Get diagnostic payment amount (already captured)
    let diagnosticAmount = 0
    if (job.diagnosticPaymentIntentId) {
      const diagnosticIntent = await stripe.paymentIntents.retrieve(job.diagnosticPaymentIntentId)
      diagnosticAmount = diagnosticIntent.amount / 100
    }

    const repairAmount = capturedRepairIntent.amount / 100
    const totalAmount = diagnosticAmount + repairAmount
    const platformFee = totalAmount * 0.15
    const providerPayout = totalAmount * 0.85

    // Create Payment record
    await prisma.payment.create({
      data: {
        jobId: params.id,
        stripePaymentIntentId: job.diagnosticPaymentIntentId || job.repairPaymentIntentId,
        amount: totalAmount,
        platformFee,
        providerAmount: providerPayout,
        status: 'captured',
        authorizedAt: new Date(),
        capturedAt: new Date()
      }
    })

    // Update job status
    await prisma.jobRequest.update({
      where: { id: params.id },
      data: {
        status: 'completed'
      }
    })

    console.log('[JOB_COMPLETED]', {
      jobId: params.id,
      diagnosticAmount,
      repairAmount,
      totalAmount,
      platformFee,
      providerPayout
    })

    return NextResponse.json({
      success: true,
      payment: {
        repairAmount,
        totalAmount,
        platformFee,
        providerPayout
      }
    })

  } catch (error: any) {
    console.error('[COMPLETE_JOB_ERROR]', error)
    
    // Handle Stripe errors
    if (error.type?.includes('Stripe')) {
      return NextResponse.json(
        { error: { message: error.message || 'Payment capture failed', code: 'STRIPE_ERROR' } },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: { message: 'Failed to complete job', code: 'SERVER_ERROR' } },
      { status: 500 }
    )
  }
}
