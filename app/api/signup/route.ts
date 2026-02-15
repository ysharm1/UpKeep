import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Lazy load heavy dependencies
    const { UserRole } = await import('@prisma/client')
    const { authService } = await import('@/lib/auth/auth.service')
    
    const body = await request.json()
    const { email, password, role, profileData, address } = body

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const user = await authService.register({
      email,
      password,
      role,
      profileData,
      address,
    })

    const { passwordHash, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: userWithoutPassword,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[SIGNUP] Error:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Registration failed', stack: error.stack },
      { status: 500 }
    )
  }
}
