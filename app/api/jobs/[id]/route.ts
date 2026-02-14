import { NextRequest, NextResponse } from 'next/server'
import { jobService } from '@/lib/jobs/job.service'
import { authService } from '@/lib/auth/auth.service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobRequest = await jobService.getJobRequest(params.id)

    if (!jobRequest) {
      return NextResponse.json({ error: 'Job request not found' }, { status: 404 })
    }

    return NextResponse.json({ jobRequest })
  } catch (error: any) {
    console.error('Get job error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get job request' },
      { status: 400 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    await authService.validateSession(token)

    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'Missing status field' }, { status: 400 })
    }

    const jobRequest = await jobService.updateJobStatus(params.id, status)

    return NextResponse.json({
      message: 'Job status updated successfully',
      jobRequest,
    })
  } catch (error: any) {
    console.error('Update job status error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update job status' },
      { status: 400 }
    )
  }
}
