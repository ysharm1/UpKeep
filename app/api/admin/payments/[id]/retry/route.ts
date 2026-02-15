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

    const { reason } = await request.json();

    // Get payment record
    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        jobRequest: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    if (payment.status === 'completed') {
      return NextResponse.json(
        { error: 'Payment is already completed' },
        { status: 400 }
      );
    }

    const job = payment.jobRequest;
    let diagnosticAmount = 0;
    let repairAmount = 0;
    const errors = [];

    // Retry diagnostic payment capture
    if (job.diagnosticPaymentIntentId) {
      try {
        const diagnosticPI = await stripe.paymentIntents.retrieve(job.diagnosticPaymentIntentId);
        if (diagnosticPI.status === 'requires_capture') {
          const captured = await stripe.paymentIntents.capture(job.diagnosticPaymentIntentId);
          diagnosticAmount = captured.amount / 100;
        } else if (diagnosticPI.status === 'succeeded') {
          diagnosticAmount = diagnosticPI.amount / 100;
        } else {
          errors.push(`Diagnostic payment in status: ${diagnosticPI.status}`);
        }
      } catch (error: any) {
        errors.push(`Diagnostic payment error: ${error.message}`);
      }
    }

    // Retry repair payment capture
    if (job.repairPaymentIntentId) {
      try {
        const repairPI = await stripe.paymentIntents.retrieve(job.repairPaymentIntentId);
        if (repairPI.status === 'requires_capture') {
          const captured = await stripe.paymentIntents.capture(job.repairPaymentIntentId);
          repairAmount = captured.amount / 100;
        } else if (repairPI.status === 'succeeded') {
          repairAmount = repairPI.amount / 100;
        } else {
          errors.push(`Repair payment in status: ${repairPI.status}`);
        }
      } catch (error: any) {
        errors.push(`Repair payment error: ${error.message}`);
      }
    }

    // Update payment record
    const totalAmount = diagnosticAmount + repairAmount;
    const platformFee = totalAmount * 0.15;
    const providerPayout = totalAmount * 0.85;

    const updatedPayment = await prisma.payment.update({
      where: { id: params.id },
      data: {
        totalAmount,
        platformFee,
        providerPayout,
        status: errors.length === 0 ? 'completed' : 'failed',
      },
    });

    // Log admin action
    console.log(`[ADMIN ACTION] User ${authResult.userId} retried payment ${params.id}. Success: ${errors.length === 0}. Reason: ${reason || 'Not provided'}`);

    return NextResponse.json({
      success: errors.length === 0,
      payment: updatedPayment,
      errors: errors.length > 0 ? errors : undefined,
      message: errors.length === 0 ? 'Payment retry successful' : 'Payment retry completed with errors',
    });
  } catch (error) {
    console.error('Error retrying payment:', error);
    return NextResponse.json(
      { error: 'Failed to retry payment' },
      { status: 500 }
    );
  }
}
