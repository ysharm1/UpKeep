export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth/auth.middleware';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { paymentType, reason } = await request.json();

    if (!paymentType || !['diagnostic', 'repair'].includes(paymentType)) {
      return NextResponse.json(
        { error: 'Invalid payment type. Must be "diagnostic" or "repair"' },
        { status: 400 }
      );
    }

    // Get job
    const job = await prisma.jobRequest.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    let paymentIntentId: string | null = null;
    let capturedAmount = 0;

    if (paymentType === 'diagnostic') {
      paymentIntentId = job.diagnosticPaymentIntentId;
    } else {
      paymentIntentId = job.repairPaymentIntentId;
    }

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: `No ${paymentType} payment intent found for this job` },
        { status: 400 }
      );
    }

    // Capture the payment
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
    capturedAmount = paymentIntent.amount / 100; // Convert from cents

    // Log admin action
    console.log(`[ADMIN ACTION] User ${authResult.userId} force captured ${paymentType} payment for job ${params.id}. Amount: $${capturedAmount}. Reason: ${reason || 'Not provided'}`);

    return NextResponse.json({
      success: true,
      paymentType,
      amount: capturedAmount,
      paymentIntentId,
      message: `${paymentType} payment captured successfully`,
    });
  } catch (error: any) {
    console.error('Error capturing payment:', error);
    
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to capture payment' },
      { status: 500 }
    );
  }
}
