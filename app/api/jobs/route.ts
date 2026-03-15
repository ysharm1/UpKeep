export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { jobService } from '@/lib/jobs/job.service'
import { authService } from '@/lib/auth/auth.service'
import { ServiceCategory } from '@prisma/client'
import { sendNewLeadNotification } from '@/lib/sms'
import { prisma } from '@/lib/prisma'
import { geocodeAddress, calculateDistance } from '@/lib/geocoding'

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

    // Geocode the address for geographic filtering
    const coordinates = await geocodeAddress({
      street: location.street,
      city: location.city,
      state: location.state,
      zipCode: location.zipCode,
    })

    // Update job with coordinates if geocoding succeeded
    if (coordinates) {
      await prisma.jobRequest.update({
        where: { id: jobRequest.id },
        data: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        },
      })
    }

    // Find registered providers matching this category from the database
    const matchingProviders = await prisma.serviceProviderProfile.findMany({
      where: {
        isActive: true,
        specialties: { has: category as ServiceCategory },
        phoneNumber: { not: '' },
      },
      include: { user: true },
    })

    // Filter by geographic proximity if we have job coordinates
    const nearbyProviders = coordinates
      ? matchingProviders.filter((provider) => {
          // If provider hasn't set their location, include them (they may be new)
          if (!provider.latitude || !provider.longitude) return true
          const distance = calculateDistance(
            { latitude: provider.latitude, longitude: provider.longitude },
            coordinates
          )
          return distance <= (provider.serviceRadius || 25)
        })
      : matchingProviders

    // Send SMS notifications to nearby providers
    let notifiedCount = 0
    for (const provider of nearbyProviders) {
      const sent = await sendNewLeadNotification(
        provider.phoneNumber,
        provider.businessName,
        category,
        `${location.city}, ${location.state}`,
        jobRequest.id
      )
      if (sent) notifiedCount++
    }

    console.log(`Notified ${notifiedCount} providers for ${category} lead in ${location.city}, ${location.state}`)

    return NextResponse.json({
      message: 'Job request created successfully',
      jobRequest,
      partnersNotified: notifiedCount,
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
