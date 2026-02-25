export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'
import { checkVerificationCode } from '@/lib/phone-verification'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await authService.validateSession(token)

    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      )
    }

    // Get phone number from user profile
    let phoneNumber: string | null = null
    
    if (user.role === 'homeowner' && user.homeownerProfile) {
      phoneNumber = user.homeownerProfile.phoneNumber
    } else if (user.role === 'service_provider' && user.serviceProviderProfile) {
      phoneNumber = user.serviceProviderProfile.phoneNumber
    }

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number not found in profile' },
        { status: 400 }
      )
    }

    const result = await checkVerificationCode(phoneNumber, code)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Update user's phoneVerified status
    await prisma.user.update({
      where: { id: user.id },
      data: { phoneVerified: true },
    })

    return NextResponse.json({
      message: 'Phone verified successfully',
      phoneVerified: true,
    })
  } catch (error: any) {
    console.error('Verify phone error:', error)
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    )
  }
}
