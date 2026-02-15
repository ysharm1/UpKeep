export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth/auth.middleware'

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: { message: 'Authentication required', code: 'AUTH_REQUIRED' } },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json(
        { error: { message: 'Invalid token', code: 'AUTH_REQUIRED' } },
        { status: 401 }
      )
    }

    // Get provider profile
    const profile = await prisma.serviceProviderProfile.findUnique({
      where: { id: params.id },
      include: { user: true }
    })

    if (!profile) {
      return NextResponse.json(
        { error: { message: 'Provider not found', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Verify user owns this profile
    if (profile.userId !== decoded.userId) {
      return NextResponse.json(
        { error: { message: 'Not authorized to update this profile', code: 'FORBIDDEN' } },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { diagnosticFee } = body

    // Validate diagnostic fee
    if (typeof diagnosticFee !== 'number') {
      return NextResponse.json(
        { error: { message: 'Diagnostic fee must be a number', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    if (diagnosticFee < 50 || diagnosticFee > 150) {
      return NextResponse.json(
        { error: { message: 'Diagnostic fee must be between $50 and $150', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    // Update profile
    const updatedProfile = await prisma.serviceProviderProfile.update({
      where: { id: params.id },
      data: { diagnosticFee }
    })

    return NextResponse.json({
      success: true,
      profile: updatedProfile
    })

  } catch (error) {
    console.error('[DIAGNOSTIC_FEE_UPDATE_ERROR]', error)
    return NextResponse.json(
      { error: { message: 'Failed to update diagnostic fee', code: 'SERVER_ERROR' } },
      { status: 500 }
    )
  }
}
