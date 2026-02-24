import Stripe from 'stripe'
import { prisma } from './prisma'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
})

/**
 * Create a Stripe customer for a service provider
 */
export async function createStripeCustomer(
  providerId: string,
  email: string,
  businessName: string
): Promise<string> {
  try {
    const customer = await stripe.customers.create({
      email,
      name: businessName,
      metadata: {
        providerId,
      },
    })

    // Update provider with Stripe customer ID
    await prisma.serviceProviderProfile.update({
      where: { id: providerId },
      data: { stripeCustomerId: customer.id },
    })

    return customer.id
  } catch (error) {
    console.error('Error creating Stripe customer:', error)
    throw new Error('Failed to create Stripe customer')
  }
}

/**
 * Charge provider $15 to view a lead
 */
export async function chargeViewFee(
  providerId: string,
  jobRequestId: string
): Promise<{ success: boolean; chargeId?: string; error?: string }> {
  try {
    // Get provider's Stripe customer ID
    const provider = await prisma.serviceProviderProfile.findUnique({
      where: { id: providerId },
      include: { user: true },
    })

    if (!provider) {
      return { success: false, error: 'Provider not found' }
    }

    // Create Stripe customer if doesn't exist
    let customerId = provider.stripeCustomerId
    if (!customerId) {
      customerId = await createStripeCustomer(
        providerId,
        provider.user.email,
        provider.businessName
      )
    }

    // Check if already viewed
    const existingView = await prisma.leadView.findUnique({
      where: {
        jobRequestId_providerId: {
          jobRequestId,
          providerId,
        },
      },
    })

    if (existingView) {
      return { success: false, error: 'Already viewed this lead' }
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1500, // $15 in cents
      currency: 'usd',
      customer: customerId,
      description: `View lead ${jobRequestId}`,
      metadata: {
        providerId,
        jobRequestId,
        type: 'view_fee',
      },
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    })

    // Create LeadView record
    await prisma.leadView.create({
      data: {
        jobRequestId,
        providerId,
        stripeChargeId: paymentIntent.id,
        amount: 1500,
      },
    })

    // Update job request view count
    await prisma.jobRequest.update({
      where: { id: jobRequestId },
      data: {
        viewCount: { increment: 1 },
        leadStatus: 'viewed',
      },
    })

    // Update provider stats
    await prisma.serviceProviderProfile.update({
      where: { id: providerId },
      data: {
        totalLeadsViewed: { increment: 1 },
        totalSpent: { increment: 1500 },
      },
    })

    return { success: true, chargeId: paymentIntent.id }
  } catch (error: any) {
    console.error('Error charging view fee:', error)
    return { success: false, error: error.message || 'Payment failed' }
  }
}

/**
 * Charge provider $50 to accept a lead
 */
export async function chargeAcceptFee(
  providerId: string,
  jobRequestId: string
): Promise<{ success: boolean; chargeId?: string; error?: string }> {
  try {
    // Get provider's Stripe customer ID
    const provider = await prisma.serviceProviderProfile.findUnique({
      where: { id: providerId },
    })

    if (!provider || !provider.stripeCustomerId) {
      return { success: false, error: 'Provider not found or no payment method' }
    }

    // Check if lead is still available
    const jobRequest = await prisma.jobRequest.findUnique({
      where: { id: jobRequestId },
    })

    if (!jobRequest) {
      return { success: false, error: 'Lead not found' }
    }

    if (jobRequest.leadStatus === 'accepted') {
      return { success: false, error: 'Lead already accepted by another provider' }
    }

    // Check if provider viewed the lead
    const leadView = await prisma.leadView.findUnique({
      where: {
        jobRequestId_providerId: {
          jobRequestId,
          providerId,
        },
      },
    })

    if (!leadView) {
      return { success: false, error: 'Must view lead before accepting' }
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 5000, // $50 in cents
      currency: 'usd',
      customer: provider.stripeCustomerId,
      description: `Accept lead ${jobRequestId}`,
      metadata: {
        providerId,
        jobRequestId,
        type: 'accept_fee',
      },
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    })

    // Create LeadAcceptance record
    await prisma.leadAcceptance.create({
      data: {
        jobRequestId,
        providerId,
        stripeChargeId: paymentIntent.id,
        amount: 5000,
      },
    })

    // Update job request
    await prisma.jobRequest.update({
      where: { id: jobRequestId },
      data: {
        leadStatus: 'accepted',
        acceptedBy: providerId,
        acceptedAt: new Date(),
        serviceProviderId: providerId,
      },
    })

    // Update provider stats
    await prisma.serviceProviderProfile.update({
      where: { id: providerId },
      data: {
        totalLeadsAccepted: { increment: 1 },
        totalSpent: { increment: 5000 },
      },
    })

    return { success: true, chargeId: paymentIntent.id }
  } catch (error: any) {
    console.error('Error charging accept fee:', error)
    return { success: false, error: error.message || 'Payment failed' }
  }
}

/**
 * Get provider's payment method
 */
export async function getProviderPaymentMethod(customerId: string) {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    })

    return paymentMethods.data[0] || null
  } catch (error) {
    console.error('Error getting payment method:', error)
    return null
  }
}

/**
 * Attach payment method to customer
 */
export async function attachPaymentMethod(
  customerId: string,
  paymentMethodId: string
) {
  try {
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    })

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    return { success: true }
  } catch (error: any) {
    console.error('Error attaching payment method:', error)
    return { success: false, error: error.message }
  }
}
