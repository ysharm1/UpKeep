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
        }
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
        { error: { message: 'Not authorized to capture payment for this job', code: 'FORBIDDEN' } },
        { status: 403 }
      )
    }

    // Check if diagnostic payment intent exists
    if (!job.diagnosticPaymentIntentId) {
      return NextResponse.json(
        { error: { message: 'No diagnostic payment to capture', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    // Check if already captured
    if (job.status === 'diagnostic_completed' || job.status === 'repair_pending_approval' || job.status === 'repair_approved' || job.status === 'completed') {
      return NextResponse.json(
        { error: { message: 'Diagnostic payment already captured', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    // Capture the payment intent
    const capturedIntent = await stripe.paymentIntents.capture(job.diagnosticPaymentIntentId)

    // Update job status
    const updatedJob = await prisma.jobRequest.update({
      where: { id: params.id },
      data: {
        status: 'diagnostic_completed'
      }
    })

    console.log('[DIAGNOSTIC_CAPTURED]', {
      jobId: params.id,
      paymentIntentId: job.diagnosticPaymentIntentId,
      amount: capturedIntent.amount / 100
    })

    return NextResponse.json({
      success: true,
      captured: {
        amount: capturedIntent.amount / 100,
        paymentIntentId: capturedIntent.id
      }
    })

  } catch (error: any) {
    console.error('[CAPTURE_DIAGNOSTIC_ERROR]', error)
    
    // Handle Stripe errors
    if (error.type?.includes('Stripe')) {
      return NextResponse.json(
        { error: { message: error.message || 'Payment capture failed', code: 'STRIPE_ERROR' } },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: { message: 'Failed to capture diagnostic payment', code: 'SERVER_ERROR' } },
      { status: 500 }
    )
  }
}
