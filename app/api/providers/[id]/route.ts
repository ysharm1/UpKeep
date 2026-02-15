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
        { error: 'Only service providers can update profiles' },
        { status: 403 }
      )
    }

    const { diagnosticFee, specialties, businessName, phoneNumber, licenseNumber } = await request.json()

    // Validate diagnostic fee if provided
    if (diagnosticFee !== undefined && (typeof diagnosticFee !== 'number' || diagnosticFee < 0)) {
      return NextResponse.json(
        { error: 'Invalid diagnostic fee' },
        { status: 400 }
      )
    }

    // Validate specialties if provided
    const validSpecialties = ['hvac', 'plumbing', 'electrical', 'general_maintenance']
    if (specialties && !Array.isArray(specialties)) {
      return NextResponse.json(
        { error: 'Specialties must be an array' },
        { status: 400 }
      )
    }
    if (specialties && specialties.some((s: string) => !validSpecialties.includes(s))) {
      return NextResponse.json(
        { error: 'Invalid specialty' },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: any = {}
    if (diagnosticFee !== undefined) updateData.diagnosticFee = diagnosticFee
    if (specialties !== undefined) updateData.specialties = specialties
    if (businessName !== undefined) updateData.businessName = businessName
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber
    if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber

    // Update provider profile
    const updatedProfile = await prisma.serviceProviderProfile.update({
      where: {
        id: params.id,
        userId: user.id, // Ensure provider can only update their own profile
      },
      data: updateData,
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: updatedProfile,
    })
  } catch (error: any) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    )
  }
}
