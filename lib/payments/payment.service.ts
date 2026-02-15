import { Payment, PaymentStatus } from '@prisma/client'
import Stripe from 'stripe'
import { prisma } from '../prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

const PLATFORM_FEE_PERCENTAGE = 0.15 // 15%

export class PaymentService {
  /**
   * Create payment intent
   * Requirements: 8.3
   */
  async createPaymentIntent(jobId: string, amount: number): Promise<Payment> {
    const job = await prisma.jobRequest.findUnique({
      where: { id: jobId },
      include: {
        homeowner: {
          include: { user: true },
        },
      },
    })

    if (!job) {
      throw new Error('Job not found')
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        jobId,
        homeownerId: job.homeownerId,
      },
    })

    // Calculate fees
    const platformFee = amount * PLATFORM_FEE_PERCENTAGE
    const providerAmount = amount - platformFee

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        jobId,
        stripePaymentIntentId: paymentIntent.id,
        amount,
        platformFee,
        providerAmount,
        status: PaymentStatus.pending,
      },
    })

    return payment
  }

  /**
   * Authorize payment
   * Requirements: 8.3
   */
  async authorizePayment(paymentId: string): Promise<Payment> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      throw new Error('Payment not found')
    }

    // Confirm payment intent with Stripe
    await stripe.paymentIntents.confirm(payment.stripePaymentIntentId)

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.authorized,
        authorizedAt: new Date(),
      },
    })

    return updatedPayment
  }

  /**
   * Capture payment
   * Requirements: 8.5
   */
  async capturePayment(paymentId: string): Promise<Payment> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      throw new Error('Payment not found')
    }

    if (payment.status !== PaymentStatus.authorized) {
      throw new Error('Payment must be authorized before capture')
    }

    // Capture payment with Stripe
    await stripe.paymentIntents.capture(payment.stripePaymentIntentId)

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.captured,
        capturedAt: new Date(),
      },
    })

    return updatedPayment
  }

  /**
   * Get transaction history
   * Requirements: 8.8, 10.6
   */
  async getTransactionHistory(userId: string): Promise<Payment[]> {
    const payments = await prisma.payment.findMany({
      where: {
        job: {
          OR: [{ homeownerId: userId }, { serviceProviderId: userId }],
        },
      },
      include: {
        job: {
          include: {
            homeowner: true,
            serviceProvider: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return payments
  }
}

export const paymentService = new PaymentService()
