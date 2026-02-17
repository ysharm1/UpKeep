export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { jobService } from '@/lib/jobs/job.service'
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

    // Verify user is a service provider
    if (user.role !== 'service_provider') {
      return NextResponse.json({ error: 'Only service providers can claim jobs' }, { status: 403 })
    }

    // Get provider profile
    const providerProfile = await prisma.serviceProviderProfile.findUnique({
      where: { userId: user.id },
    })

    if (!providerProfile) {
      return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 })
    }

    // Get job request
    const jobRequest = await jobService.getJobRequest(params.id)

    if (!jobRequest) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Verify job is available (not claimed yet)
    if (jobRequest.serviceProviderId) {
      return NextResponse.json({ error: 'Job already claimed' }, { status: 403 })
    }

    // Verify job is in a claimable status
    const claimableStatuses = ['submitted', 'pending_match', 'ai_diagnosis']
    if (!claimableStatuses.includes(jobRequest.status)) {
      return NextResponse.json({ error: 'Job is not available for claiming' }, { status: 403 })
    }

    // Claim the job
    const updatedJob = await prisma.jobRequest.update({
      where: { id: params.id },
      data: {
        serviceProviderId: providerProfile.id,
        status: 'matched',
      },
    })

    // Create message thread for communication
    await prisma.messageThread.create({
      data: {
        jobRequestId: updatedJob.id,
        homeownerId: updatedJob.homeownerId,
        serviceProviderId: providerProfile.id,
      },
    })

    return NextResponse.json({ 
      message: 'Job claimed successfully',
      jobRequest: updatedJob 
    })
  } catch (error: any) {
    console.error('Claim job error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to claim job' },
      { status: 400 }
    )
  }
}
