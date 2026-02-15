import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'
import { prisma } from '@/lib/prisma'

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

    if (user.role !== 'service_provider') {
      return NextResponse.json({ error: 'Only service providers can claim jobs' }, { status: 403 })
    }

    const jobId = params.id

    // Get provider profile
    const providerProfile = await prisma.serviceProviderProfile.findUnique({
      where: { userId: user.id },
    })

    if (!providerProfile) {
      return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 })
    }

    // Check if provider has set diagnostic fee
    if (!providerProfile.diagnosticFee) {
      return NextResponse.json(
        { error: 'Please set your diagnostic fee in settings before claiming jobs' },
        { status: 400 }
      )
    }

    // Get the job
    const job = await prisma.jobRequest.findUnique({
      where: { id: jobId },
      include: {
        location: true,
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Check if job is available
    if (job.serviceProviderId) {
      return NextResponse.json({ error: 'Job already claimed by another provider' }, { status: 400 })
    }

    if (!['submitted', 'pending_match'].includes(job.status)) {
      return NextResponse.json({ error: 'Job is not available for claiming' }, { status: 400 })
    }

    // Check if job category matches provider specialties
    if (!providerProfile.specialties.includes(job.category)) {
      return NextResponse.json(
        { error: 'This job category does not match your specialties' },
        { status: 400 }
      )
    }

    // Claim the job
    const updatedJob = await prisma.jobRequest.update({
      where: { id: jobId },
      data: {
        serviceProviderId: providerProfile.id,
        status: 'matched',
      },
      include: {
        location: true,
        homeowner: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      message: 'Job claimed successfully',
      job: {
        id: updatedJob.id,
        category: updatedJob.category,
        description: updatedJob.description,
        status: updatedJob.status,
        location: updatedJob.location,
        homeowner: {
          email: updatedJob.homeowner.user.email,
        },
      },
    })
  } catch (error: any) {
    console.error('Claim job error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to claim job' },
      { status: 500 }
    )
  }
}
