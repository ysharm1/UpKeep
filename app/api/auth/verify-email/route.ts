export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Find the verification token
    const verificationRecord = await prisma.refreshToken.findUnique({
      where: { token: `verify_${token}` },
      include: { user: true },
    })

    if (!verificationRecord) {
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 400 })
    }

    // Check if token is expired
    if (verificationRecord.expiresAt < new Date()) {
      await prisma.refreshToken.delete({
        where: { id: verificationRecord.id },
      })
      return NextResponse.json({ error: 'Verification token expired' }, { status: 400 })
    }

    // Update user's email verified status
    await prisma.user.update({
      where: { id: verificationRecord.userId },
      data: { emailVerified: true },
    })

    // Delete the verification token
    await prisma.refreshToken.delete({
      where: { id: verificationRecord.id },
    })

    return NextResponse.json({ 
      message: 'Email verified successfully',
      email: verificationRecord.user.email,
    })
  } catch (error: any) {
    console.error('Verify email error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify email' },
      { status: 500 }
    )
  }
}
