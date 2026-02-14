import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Missing token or new password' },
        { status: 400 }
      )
    }

    await authService.resetPassword(token, newPassword)

    return NextResponse.json({
      message: 'Password reset successful',
    })
  } catch (error: any) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: error.message || 'Password reset failed' },
      { status: 400 }
    )
  }
}
