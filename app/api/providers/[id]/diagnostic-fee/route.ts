export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'
import { prisma } from '@/lib/prisma'

export async function PUT(
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

    if (user.role !== 'service_provider') {
      return NextResponse.json(
        { error: 'Only service providers can update diagnostic fees' },
        { status: 403 }
      )
    }

    const { diagnosticFee } = await request.json()

    // Validate diagnostic fee
    if (typeof diagnosticFee !== 'number' || diagnosticFee < 0) {
      return NextResponse.json(
        { error: 'Invalid diagnostic fee' },
        { status: 400 }
      )
    }

    // Update provider profile
    const updatedProfile = await prisma.serviceProviderProfile.update({
      where: {
        id: params.id,
        userId: user.id, // Ensure provider can only update their own profile
      },
      data: {
        diagnosticFee,
      },
    })

    return NextResponse.json({
      message: 'Diagnostic fee updated successfully',
      diagnosticFee: updatedProfile.diagnosticFee,
    })
  } catch (error: any) {
    console.error('Update diagnostic fee error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update diagnostic fee' },
      { status: 500 }
    )
  }
}
