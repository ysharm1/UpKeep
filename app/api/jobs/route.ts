export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { jobService } from '@/lib/jobs/job.service'
import { authService } from '@/lib/auth/auth.service'
import { ServiceCategory } from '@prisma/client'
import { findPartnersForCategory } from '@/lib/partners'
import { sendNewLeadNotification } from '@/lib/sms'
import { prisma } from '@/lib/prisma'

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
    const { category, propertyType = 'residential', description, location, mediaFileIds } = body

    if (!category || !description || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: category, description, location' },
        { status: 400 }
      )
    }

    // Create the job request
    const jobRequest = await jobService.createJobRequest({
      homeownerId: user.homeownerProfile!.id,
      category: category as ServiceCategory,
      propertyType,
      description,
      location,
      mediaFileIds,
    })

    // PAY-TO-PLAY MODEL: Send SMS to ALL partners in this category
    const partners = findPartnersForCategory(category)
    
    if (partners.length > 0) {
      console.log(`📢 Broadcasting lead to ${partners.length} partners via SMS`)
      
      for (const partner of partners) {
        // Find provider account for this partner
        const providerProfile = await prisma.serviceProviderProfile.findFirst({
          where: {
            user: {
              email: partner.email,
            },
          },
        })

        if (providerProfile) {
          // Send SMS notification
          await sendNewLeadNotification(
            partner.phone,
            partner.name,
            category,
            location,
            jobRequest.id
          )

          console.log(`✅ SMS sent to partner: ${partner.name}`)
        } else {
          console.warn(`⚠️ Partner ${partner.name} doesn't have a provider account yet`)
        }
      }
    } else {
      console.warn(`⚠️ No partners found for category: ${category}`)
    }

    return NextResponse.json({
      message: 'Job request created successfully',
      jobRequest,
      partnersNotified: partners.length,
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
