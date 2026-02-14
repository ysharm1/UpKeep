import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Missing refresh token' },
        { status: 400 }
      )
    }

    const authToken = await authService.refreshToken(refreshToken)

    return NextResponse.json({
      message: 'Token refreshed successfully',
      ...authToken,
    })
  } catch (error: any) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: error.message || 'Token refresh failed' },
      { status: 401 }
    )
  }
}
