import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth/auth.middleware'
import { DiagnosticRecommendation, DiagnosticSeverity } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { summary, recommendation, severity, estimatedCost, photoUrls } = await request.json()

    // Validation
    if (!summary || summary.trim().length < 20) {
      return NextResponse.json(
        { error: 'Diagnosis summary must be at least 20 characters' },
        { status: 400 }
      )
    }

    if (!recommendation || !Object.values(DiagnosticRecommendation).includes(recommendation)) {
      return NextResponse.json(
        { error: 'Valid recommendation is required (REPAIR, REPLACE, MONITOR, NO_ACTION_NEEDED)' },
        { status: 400 }
      )
    }

    if (!photoUrls || photoUrls.length === 0) {
      return NextResponse.json(
        { error: 'At least one photo is required' },
        { status: 400 }
      )
    }

    if (severity && !Object.values(DiagnosticSeverity).includes(severity)) {
      return NextResponse.json(
        { error: 'Invalid severity level' },
        { status: 400 }
      )
    }

    // Get job and verify provider is assigned
    const job = await prisma.jobRequest.findUnique({
      where: { id: params.id },
      include: {
        serviceProvider: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.serviceProvider?.userId !== authResult.userId) {
      return NextResponse.json(
        { error: 'Only the assigned provider can submit a diagnostic report' },
        { status: 403 }
      )
    }

    // Check if diagnostic report already exists
    const existingReport = await prisma.diagnosticReport.findUnique({
      where: { jobRequestId: params.id },
    })

    if (existingReport) {
      return NextResponse.json(
        { error: 'Diagnostic report already submitted for this job' },
        { status: 400 }
      )
    }

    // Create diagnostic report
    const report = await prisma.diagnosticReport.create({
      data: {
        jobRequestId: params.id,
        providerId: authResult.userId,
        summary,
        recommendation,
        severity,
        estimatedCost,
        photoUrls,
      },
    })

    // Update job status
    await prisma.jobRequest.update({
      where: { id: params.id },
      data: { status: 'diagnostic_completed' },
    })

    return NextResponse.json({
      success: true,
      report,
      message: 'Professional assessment submitted successfully',
    })
  } catch (error) {
    console.error('Error submitting diagnostic report:', error)
    return NextResponse.json(
      { error: 'Failed to submit diagnostic report' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get job to verify access
    const job = await prisma.jobRequest.findUnique({
      where: { id: params.id },
      include: {
        homeowner: {
          select: { userId: true },
        },
        serviceProvider: {
          select: { userId: true },
        },
      },
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Verify user is homeowner or assigned provider
    const isHomeowner = job.homeowner.userId === authResult.userId
    const isProvider = job.serviceProvider?.userId === authResult.userId

    if (!isHomeowner && !isProvider) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get diagnostic report
    const report = await prisma.diagnosticReport.findUnique({
      where: { jobRequestId: params.id },
    })

    return NextResponse.json({
      report,
    })
  } catch (error) {
    console.error('Error fetching diagnostic report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch diagnostic report' },
      { status: 500 }
    )
  }
}
