export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'
import { UserRole } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    console.log('[REGISTER] Starting registration request')
    
    let body
    try {
      body = await request.json()
      console.log('[REGISTER] Body parsed successfully')
    } catch (e) {
      console.error('[REGISTER] Failed to parse body:', e)
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { email, password, role, profileData, address } = body

    // Validate required fields
    if (!email || !password || !role) {
      console.log('[REGISTER] Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: email, password, role' },
        { status: 400 }
      )
    }

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      console.log('[REGISTER] Invalid role:', role)
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    console.log('[REGISTER] Calling authService.register')
    
    // Register user
    const user = await authService.register({
      email,
      password,
      role,
      profileData,
      address,
    })

    console.log('[REGISTER] User registered successfully')

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: userWithoutPassword,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[REGISTER] Registration error:', error)
    console.error('[REGISTER] Error stack:', error.stack)
    return NextResponse.json(
      { error: error.message || 'Registration failed', details: error.toString() },
      { status: 500 }
    )
  }
}
