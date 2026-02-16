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

    const jobRequest = await jobService.getJobRequest(params.id)

    if (!jobRequest) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Verify user has access to this job
    console.log('Authorization check:', {
      userId: user.id,
      userRole: user.role,
      homeownerProfileId: user.homeownerProfile?.id,
      providerProfileId: user.serviceProviderProfile?.id,
      jobHomeownerId: jobRequest.homeownerId,
      jobProviderId: jobRequest.serviceProviderId,
    })

    const isHomeowner = jobRequest.homeownerId === user.homeownerProfile?.id
    const isProvider = jobRequest.serviceProviderId === user.serviceProviderProfile?.id

    if (!isHomeowner && !isProvider) {
      console.error('Access denied: User does not own this job')
      return NextResponse.json({ 
        error: 'Unauthorized - You do not have access to this job',
        debug: {
          isHomeowner,
          isProvider,
          hasHomeownerProfile: !!user.homeownerProfile,
          hasProviderProfile: !!user.serviceProviderProfile,
        }
      }, { status: 403 })
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
