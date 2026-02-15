export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    const resetToken = await authService.requestPasswordReset(email)

    // In production, this would send an email
    // For development, return the token
    return NextResponse.json({
      message: 'If an account exists, a reset link has been sent',
      // Remove this in production:
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    })
  } catch (error: any) {
    console.error('Password reset request error:', error)
    return NextResponse.json(
      { error: 'Password reset request failed' },
      { status: 500 }
    )
  }
}
