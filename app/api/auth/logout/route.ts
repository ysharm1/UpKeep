import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    await authService.logout(user.id)

    return NextResponse.json({
      message: 'Logout successful',
    })
  } catch (error: any) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: error.message || 'Logout failed' },
      { status: 401 }
    )
  }
}

async function requireAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized')
  }

  const token = authHeader.substring(7)
  const user = await authService.validateSession(token)

  return user
}
