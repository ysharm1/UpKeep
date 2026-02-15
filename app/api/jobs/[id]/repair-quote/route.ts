import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth/auth.middleware'

const prisma = new PrismaClient()

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
        { error: { message: 'Not authorized to submit quote for this job', code: 'FORBIDDEN' } },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { laborCost, partsCost, notes } = body

    // Validate costs
    if (typeof laborCost !== 'number' || typeof partsCost !== 'number') {
      return NextResponse.json(
        { error: { message: 'Labor cost and parts cost must be numbers', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    if (laborCost < 0 || partsCost < 0) {
      return NextResponse.json(
        { error: { message: 'Costs cannot be negative', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    const totalAmount = laborCost + partsCost

    if (totalAmount === 0) {
      return NextResponse.json(
        { error: { message: 'Total amount must be greater than zero', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    // Check if quote already exists
    const existingQuote = await prisma.repairQuote.findUnique({
      where: { jobRequestId: params.id }
    })

    if (existingQuote) {
      return NextResponse.json(
        { error: { message: 'Repair quote already exists for this job', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    // Create repair quote
    const quote = await prisma.repairQuote.create({
      data: {
        jobRequestId: params.id,
        providerId: job.serviceProviderId!,
        laborCost,
        partsCost,
        totalAmount,
        notes: notes || null,
        status: 'PENDING'
      }
    })

    // Update job status
    await prisma.jobRequest.update({
      where: { id: params.id },
      data: {
        status: 'repair_pending_approval'
      }
    })

    console.log('[REPAIR_QUOTE_CREATED]', {
      jobId: params.id,
      quoteId: quote.id,
      totalAmount
    })

    return NextResponse.json({
      success: true,
      quote
    })

  } catch (error) {
    console.error('[REPAIR_QUOTE_ERROR]', error)
    return NextResponse.json(
      { error: { message: 'Failed to create repair quote', code: 'SERVER_ERROR' } },
      { status: 500 }
    )
  }
}

export async function GET(
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
        homeowner: {
          include: {
            user: true
          }
        },
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

    // Verify user is homeowner or assigned provider
    const isHomeowner = job.homeowner.userId === decoded.userId
    const isProvider = job.serviceProvider?.userId === decoded.userId

    if (!isHomeowner && !isProvider) {
      return NextResponse.json(
        { error: { message: 'Not authorized to view this quote', code: 'FORBIDDEN' } },
        { status: 403 }
      )
    }

    // Get repair quote
    const quote = await prisma.repairQuote.findUnique({
      where: { jobRequestId: params.id }
    })

    return NextResponse.json({
      quote
    })

  } catch (error) {
    console.error('[GET_REPAIR_QUOTE_ERROR]', error)
    return NextResponse.json(
      { error: { message: 'Failed to fetch repair quote', code: 'SERVER_ERROR' } },
      { status: 500 }
    )
  }
}
