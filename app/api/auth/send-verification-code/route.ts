export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'
import { sendVerificationCode } from '@/lib/phone-verification'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await authService.validateSession(token)

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

    const result = await sendVerificationCode(phoneNumber)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send verification code' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Verification code sent successfully',
      phoneNumber: phoneNumber.replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '$1***$3$4'), // Mask middle digits
    })
  } catch (error: any) {
    console.error('Send verification code error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send verification code' },
      { status: 500 }
    )
  }
}
