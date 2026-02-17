export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'
import { prisma } from '@/lib/prisma'

// GET - Fetch diagnostic report
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

    // Get job request with diagnostic report
    const jobRequest = await prisma.jobRequest.findUnique({
      where: { id: params.id },
      include: {
        diagnosticReport: true,
        homeowner: true,
        serviceProvider: true,
      },
    })

    if (!jobRequest) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Verify user is homeowner or provider
    const isHomeowner = jobRequest.homeowner.userId === user.id
    const isProvider = jobRequest.serviceProvider?.userId === user.id

    if (!isHomeowner && !isProvider) {
      return NextResponse.json({ error: 'Not authorized for this job' }, { status: 403 })
    }

    if (!jobRequest.diagnosticReport) {
      return NextResponse.json({ error: 'Diagnostic report not found' }, { status: 404 })
    }

    return NextResponse.json({
      diagnosticReport: jobRequest.diagnosticReport,
      jobRequest: {
        id: jobRequest.id,
        category: jobRequest.category,
        description: jobRequest.description,
        status: jobRequest.status,
      },
    })
  } catch (error: any) {
    console.error('Get diagnostic report error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch diagnostic report' },
      { status: 500 }
    )
  }
}

// POST - Submit diagnostic report
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

    const { summary, recommendation, severity, estimatedCost, photoUrls } = await request.json()

    if (!summary || !recommendation) {
      return NextResponse.json({ error: 'Summary and recommendation are required' }, { status: 400 })
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

    // Verify job is in correct status
    if (jobRequest.status !== 'diagnostic_scheduled') {
      return NextResponse.json({ error: 'Job must be in diagnostic_scheduled status' }, { status: 400 })
    }

    // Create or update diagnostic report
    const diagnosticReport = await prisma.diagnosticReport.upsert({
      where: { jobRequestId: params.id },
      create: {
        jobRequestId: params.id,
        providerId: jobRequest.serviceProviderId!,
        summary,
        recommendation,
        severity: severity || null,
        estimatedCost: estimatedCost || null,
        photoUrls: photoUrls || [],
      },
      update: {
        summary,
        recommendation,
        severity: severity || null,
        estimatedCost: estimatedCost || null,
        photoUrls: photoUrls || [],
      },
    })

    // Update job status
    await prisma.jobRequest.update({
      where: { id: params.id },
      data: {
        status: 'diagnostic_completed',
      },
    })

    return NextResponse.json({
      message: 'Diagnostic report submitted successfully',
      diagnosticReport,
    })
  } catch (error: any) {
    console.error('Submit diagnostic report error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit diagnostic report' },
      { status: 500 }
    )
  }
}
