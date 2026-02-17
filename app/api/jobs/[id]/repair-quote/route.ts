export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'
import { prisma } from '@/lib/prisma'

// GET - Fetch repair quote
export async function GET(
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

    // Get job request with repair quote
    const jobRequest = await prisma.jobRequest.findUnique({
      where: { id: params.id },
      include: {
        repairQuote: {
          include: {
            provider: true,
          },
        },
        homeowner: true,
        serviceProvider: true,
      },
    })

    if (!jobRequest) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Verify user is homeowner or provider
    const isHomeowner = jobRequest.homeowner.userId === user.id
    const isProvider = jobRequest.serviceProvider?.userId === user.id

    if (!isHomeowner && !isProvider) {
      return NextResponse.json({ error: 'Not authorized for this job' }, { status: 403 })
    }

    if (!jobRequest.repairQuote) {
      return NextResponse.json({ error: 'Repair quote not found' }, { status: 404 })
    }

    return NextResponse.json({
      repairQuote: jobRequest.repairQuote,
      jobRequest: {
        id: jobRequest.id,
        category: jobRequest.category,
        description: jobRequest.description,
        status: jobRequest.status,
      },
    })
  } catch (error: any) {
    console.error('Get repair quote error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch repair quote' },
      { status: 500 }
    )
  }
}

// POST - Submit repair quote
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

    const { laborCost, partsCost, notes } = await request.json()

    if (laborCost === undefined || partsCost === undefined) {
      return NextResponse.json({ error: 'Labor cost and parts cost are required' }, { status: 400 })
    }

    // Get job request
    const jobRequest = await prisma.jobRequest.findUnique({
      where: { id: params.id },
      include: {
        serviceProvider: true,
      },
    })

    if (!jobRequest) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Verify user is the assigned provider
    if (!jobRequest.serviceProvider || jobRequest.serviceProvider.userId !== user.id) {
      return NextResponse.json({ error: 'Not authorized for this job' }, { status: 403 })
    }

    // Verify job is in correct status
    if (jobRequest.status !== 'diagnostic_completed') {
      return NextResponse.json({ error: 'Job must be in diagnostic_completed status' }, { status: 400 })
    }

    const totalAmount = parseFloat(laborCost) + parseFloat(partsCost)

    // Create or update repair quote
    const repairQuote = await prisma.repairQuote.upsert({
      where: { jobRequestId: params.id },
      create: {
        jobRequestId: params.id,
        providerId: jobRequest.serviceProviderId!,
        laborCost,
        partsCost,
        totalAmount,
        notes: notes || null,
        status: 'PENDING',
      },
      update: {
        laborCost,
        partsCost,
        totalAmount,
        notes: notes || null,
        status: 'PENDING',
      },
    })

    // Update job status
    await prisma.jobRequest.update({
      where: { id: params.id },
      data: {
        status: 'repair_pending_approval',
      },
    })

    return NextResponse.json({
      message: 'Repair quote submitted successfully',
      repairQuote,
    })
  } catch (error: any) {
    console.error('Submit repair quote error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit repair quote' },
      { status: 500 }
    )
  }
}
