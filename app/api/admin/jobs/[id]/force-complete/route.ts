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

    const { reason, skipPaymentCapture } = await request.json();

    // Get job with related data
    const job = await prisma.jobRequest.findUnique({
      where: { id: params.id },
      include: {
        repairQuote: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.status === 'completed') {
      return NextResponse.json(
        { error: 'Job is already completed' },
        { status: 400 }
      );
    }

    let diagnosticAmount = 0;
    let repairAmount = 0;

    // Capture payments unless explicitly skipped
    if (!skipPaymentCapture) {
      // Capture diagnostic payment if not already captured
      if (job.diagnosticPaymentIntentId) {
        try {
          const diagnosticPI = await stripe.paymentIntents.retrieve(job.diagnosticPaymentIntentId);
          if (diagnosticPI.status === 'requires_capture') {
            const captured = await stripe.paymentIntents.capture(job.diagnosticPaymentIntentId);
            diagnosticAmount = captured.amount / 100;
          } else if (diagnosticPI.status === 'succeeded') {
            diagnosticAmount = diagnosticPI.amount / 100;
          }
        } catch (error) {
          console.error('Error capturing diagnostic payment:', error);
        }
      }

      // Capture repair payment if exists
      if (job.repairPaymentIntentId) {
        try {
          const repairPI = await stripe.paymentIntents.retrieve(job.repairPaymentIntentId);
          if (repairPI.status === 'requires_capture') {
            const captured = await stripe.paymentIntents.capture(job.repairPaymentIntentId);
            repairAmount = captured.amount / 100;
          } else if (repairPI.status === 'succeeded') {
            repairAmount = repairPI.amount / 100;
          }
        } catch (error) {
          console.error('Error capturing repair payment:', error);
        }
      }
    }

    // Calculate totals
    const totalAmount = diagnosticAmount + repairAmount;
    const platformFee = totalAmount * 0.15;
    const providerPayout = totalAmount * 0.85;

    // Create or update payment record
    const payment = await prisma.payment.upsert({
      where: { jobRequestId: job.id },
      create: {
        jobRequestId: job.id,
        totalAmount,
        platformFee,
        providerPayout,
        status: skipPaymentCapture ? 'pending' : 'completed',
      },
      update: {
        totalAmount,
        platformFee,
        providerPayout,
        status: skipPaymentCapture ? 'pending' : 'completed',
      },
    });

    // Update job status
    await prisma.jobRequest.update({
      where: { id: params.id },
      data: { status: 'completed' },
    });

    // Log admin action
    console.log(`[ADMIN ACTION] User ${authResult.userId} force completed job ${params.id}. Skip payment: ${skipPaymentCapture}. Reason: ${reason || 'Not provided'}`);

    return NextResponse.json({
      success: true,
      job: { id: job.id, status: 'completed' },
      payment,
      message: 'Job marked as completed',
    });
  } catch (error) {
    console.error('Error force completing job:', error);
    return NextResponse.json(
      { error: 'Failed to complete job' },
      { status: 500 }
    );
  }
}
