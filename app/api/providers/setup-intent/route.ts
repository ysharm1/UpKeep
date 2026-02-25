export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'
import { createSetupIntent } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await authService.validateSession(token)

    if (user.role !== 'service_provider') {
      return NextResponse.json(
        { error: 'Only service providers can setup payment methods' },
        { status: 403 }
      )
    }

    const result = await createSetupIntent(user.serviceProviderProfile!.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      clientSecret: result.clientSecret,
    })
  } catch (error: any) {
    console.error('Setup intent error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create setup intent' },
      { status: 500 }
    )
  }
}
