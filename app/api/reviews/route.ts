export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'
import { prisma } from '@/lib/prisma'

// POST - Create a review
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await authService.validateSession(token)

    const { jobId, score, review } = await request.json()

    // Validation
    if (!jobId || !score) {
      return NextResponse.json({ error: 'Job ID and score are required' }, { status: 400 })
    }

    if (score < 1 || score > 5) {
      return NextResponse.json({ error: 'Score must be between 1 and 5' }, { status: 400 })
    }

    // Get job details
    const job = await prisma.jobRequest.findUnique({
      where: { id: jobId },
      include: {
        homeowner: true,
        serviceProvider: true,
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Check if job is completed
    if (job.status !== 'completed') {
      return NextResponse.json({ error: 'Can only review completed jobs' }, { status: 400 })
    }

    // Determine reviewer and reviewee
    let reviewerId: string
    let revieweeId: string

    if (user.role === 'homeowner') {
      const profile = await prisma.homeownerProfile.findUnique({
        where: { userId: user.id },
      })
      
      if (job.homeownerId !== profile!.id) {
        return NextResponse.json({ error: 'Not authorized to review this job' }, { status: 403 })
      }

      reviewerId = user.id
      revieweeId = job.serviceProvider!.userId
    } else {
      const profile = await prisma.serviceProviderProfile.findUnique({
        where: { userId: user.id },
      })
      
      if (job.serviceProviderId !== profile!.id) {
        return NextResponse.json({ error: 'Not authorized to review this job' }, { status: 403 })
      }

      reviewerId = user.id
      revieweeId = job.homeowner.userId
    }

    // Check if review already exists
    const existingReview = await prisma.rating.findUnique({
      where: {
        jobId_reviewerId: {
          jobId,
          reviewerId,
        },
      },
    })

    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this job' }, { status: 400 })
    }

    // Create review
    const rating = await prisma.rating.create({
      data: {
        jobId,
        reviewerId,
        revieweeId,
        score,
        review: review || null,
      },
    })

    // Update provider's average rating if they're being reviewed
    if (user.role === 'homeowner') {
      const allRatings = await prisma.rating.findMany({
        where: { revieweeId },
      })

      const avgRating = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length

      await prisma.serviceProviderProfile.update({
        where: { userId: revieweeId },
        data: {
          averageRating: avgRating,
          reviewCount: allRatings.length,
        },
      })
    }

    return NextResponse.json({ rating }, { status: 201 })
  } catch (error: any) {
    console.error('Create review error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create review' },
      { status: 500 }
    )
  }
}

// GET - Get reviews for a provider
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('providerId')

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 })
    }

    const reviews = await prisma.rating.findMany({
      where: {
        revieweeId: providerId,
      },
      include: {
        job: {
          select: {
            category: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ reviews })
  } catch (error: any) {
    console.error('Get reviews error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}
