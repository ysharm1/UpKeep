export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    await authService.validateSession(token)

    const { category, location } = await request.json()

    // Find providers that:
    // 1. Have the requested specialty
    // 2. Are verified (optional for now)
    // 3. Have set a diagnostic fee
    // 4. Are in the area (for now, show all - will add location filtering later)
    
    const providers = await prisma.serviceProviderProfile.findMany({
      where: {
        specialties: {
          has: category,
        },
        diagnosticFee: {
          not: null,
        },
      },
      include: {
        user: {
          select: {
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    })

    // Format response with mock availability for now
    const formattedProviders = providers.map((provider) => ({
      id: provider.id,
      name: provider.businessName || 'Professional Service Provider',
      rating: 4.8, // TODO: Calculate from actual reviews
      reviews: 0, // TODO: Count actual reviews
      specialties: provider.specialties,
      distance: 5.0, // TODO: Calculate actual distance
      consultFee: provider.diagnosticFee || 75,
      verified: provider.verified,
      phoneNumber: provider.phoneNumber,
      licenseNumber: provider.licenseNumber,
      // Mock availability - TODO: Implement real calendar system
      availability: [
        new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after
        new Date(Date.now() + 259200000).toISOString().split('T')[0], // 3 days out
      ],
      timeSlots: ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'],
    }))

    return NextResponse.json({
      providers: formattedProviders,
      count: formattedProviders.length,
    })
  } catch (error: any) {
    console.error('Nearby providers error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch providers' },
      { status: 500 }
    )
  }
}
