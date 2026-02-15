export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { jobService } from '@/lib/jobs/job.service'
import { authService } from '@/lib/auth/auth.service'
import { ServiceCategory } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await authService.validateSession(token)

    if (user.role !== 'homeowner') {
      return NextResponse.json(
        { error: 'Only homeowners can create job requests' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { category, description, location, mediaFileIds } = body

    if (!category || !description || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: category, description, location' },
        { status: 400 }
      )
    }

    const jobRequest = await jobService.createJobRequest({
      homeownerId: user.homeownerProfile!.id,
      category: category as ServiceCategory,
      description,
      location,
      mediaFileIds,
    })

    return NextResponse.json({
      message: 'Job request created successfully',
      jobRequest,
    })
  } catch (error: any) {
    console.error('Create job error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create job request' },
      { status: 400 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await authService.validateSession(token)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const filters: any = {}
    if (status) filters.status = status
    if (category) filters.category = category
    if (startDate) filters.startDate = new Date(startDate)
    if (endDate) filters.endDate = new Date(endDate)

    const userId =
      user.role === 'homeowner'
        ? user.homeownerProfile!.id
        : user.serviceProviderProfile!.id

    const jobRequests = await jobService.getJobHistory(userId, filters)

    return NextResponse.json({ jobRequests })
  } catch (error: any) {
    console.error('Get jobs error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get job requests' },
      { status: 400 }
    )
  }
}
