export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { jobService } from '@/lib/jobs/job.service'
import { authService } from '@/lib/auth/auth.service'
import { prisma } from '@/lib/prisma'

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

    const jobRequest = await jobService.getJobRequest(params.id)

    if (!jobRequest) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Check access: homeowner who owns the job, OR service provider who purchased the lead
    const isHomeowner = jobRequest.homeownerId === user.homeownerProfile?.id

    let isProvider = false
    if (user.role === 'service_provider' && user.serviceProviderProfile) {
      const purchase = await prisma.leadView.findUnique({
        where: {
          jobRequestId_providerId: {
            jobRequestId: params.id,
            providerId: user.serviceProviderProfile.id,
          },
        },
      })
      isProvider = !!purchase
    }

    if (!isHomeowner && !isProvider) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ jobRequest })
  } catch (error: any) {
    console.error('Get job error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get job' },
      { status: 400 }
    )
  }
}
