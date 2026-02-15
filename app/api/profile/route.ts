import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await authService.validateSession(token)

    // Fetch profile with address
    let profile = null
    if (user.role === 'homeowner') {
      profile = await prisma.homeownerProfile.findUnique({
        where: { userId: user.id },
        include: {
          address: true,
        },
      })
    } else if (user.role === 'service_provider') {
      profile = await prisma.serviceProviderProfile.findUnique({
        where: { userId: user.id },
      })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      profile,
    })
  } catch (error: any) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: 401 }
    )
  }
}
