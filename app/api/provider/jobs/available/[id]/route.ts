export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { jobService } from '@/lib/jobs/job.service'
import { authService } from '@/lib/auth/auth.service'

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

    // Verify user is a service provider
    if (user.role !== 'service_provider') {
      return NextResponse.json({ error: 'Only service providers can view available jobs' }, { status: 403 })
    }

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

    return NextResponse.json({ jobRequest })
  } catch (error: any) {
    console.error('Get available job error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get job' },
      { status: 400 }
    )
  }
}
