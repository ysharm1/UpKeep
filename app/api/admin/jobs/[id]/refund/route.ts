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

    const { paymentType, amount, reason } = await request.json();

    if (!paymentType || !['diagnostic', 'repair', 'both'].includes(paymentType)) {
      return NextResponse.json(
        { error: 'Invalid payment type. Must be "diagnostic", "repair", or "both"' },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'Refund reason is required' },
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

    const refunds = [];

    // Refund diagnostic payment
    if (paymentType === 'diagnostic' || paymentType === 'both') {
      if (job.diagnosticPaymentIntentId) {
        const refund = await stripe.refunds.create({
          payment_intent: job.diagnosticPaymentIntentId,
          amount: amount ? Math.round(amount * 100) : undefined, // Partial or full refund
          reason: 'requested_by_customer',
          metadata: {
            adminUserId: authResult.userId,
            adminReason: reason,
          },
        });
        refunds.push({
          type: 'diagnostic',
          amount: refund.amount / 100,
          refundId: refund.id,
        });
      }
    }

    // Refund repair payment
    if (paymentType === 'repair' || paymentType === 'both') {
      if (job.repairPaymentIntentId) {
        const refund = await stripe.refunds.create({
          payment_intent: job.repairPaymentIntentId,
          amount: amount ? Math.round(amount * 100) : undefined, // Partial or full refund
          reason: 'requested_by_customer',
          metadata: {
            adminUserId: authResult.userId,
            adminReason: reason,
          },
        });
        refunds.push({
          type: 'repair',
          amount: refund.amount / 100,
          refundId: refund.id,
        });
      }
    }

    if (refunds.length === 0) {
      return NextResponse.json(
        { error: 'No payments found to refund' },
        { status: 400 }
      );
    }

    // Log admin action
    console.log(`[ADMIN ACTION] User ${authResult.userId} issued refund for job ${params.id}. Type: ${paymentType}. Reason: ${reason}`);

    return NextResponse.json({
      success: true,
      refunds,
      message: 'Refund(s) processed successfully',
    });
  } catch (error: any) {
    console.error('Error processing refund:', error);
    
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}
