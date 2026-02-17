export const dynamic = 'force-dynamic'
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

    const { scheduledDate } = await request.json()

    if (!scheduledDate) {
      return NextResponse.json({ error: 'Scheduled date is required' }, { status: 400 })
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

    // Verify job is in correct status (accepted - payment received)
    if (jobRequest.status !== 'accepted') {
      return NextResponse.json({ error: 'Job must be in accepted status to schedule' }, { status: 400 })
    }

    // Update job with scheduled date and change status
    const updatedJob = await prisma.jobRequest.update({
      where: { id: params.id },
      data: {
        scheduledDate: new Date(scheduledDate),
        status: 'diagnostic_scheduled',
      },
    })

    return NextResponse.json({
      message: 'Diagnostic scheduled successfully',
      jobRequest: updatedJob,
    })
  } catch (error: any) {
    console.error('Schedule diagnostic error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to schedule diagnostic' },
      { status: 500 }
    )
  }
}
