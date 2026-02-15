export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'
import { prisma } from '@/lib/prisma'
import { sendEmail, generateVerificationEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await authService.validateSession(token)

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 })
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store token in database (you'll need to add this table)
    // For now, we'll use a simple approach with RefreshToken table
    await prisma.refreshToken.create({
      data: {
        token: `verify_${verificationToken}`,
        userId: user.id,
        expiresAt,
      },
    })

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}`
    
    await sendEmail({
      to: user.email,
      subject: 'Verify your UpKeep email address',
      html: generateVerificationEmail(verificationUrl),
      text: `Please verify your email by visiting: ${verificationUrl}`,
    })

    return NextResponse.json({ 
      message: 'Verification email sent',
      // In development, return the URL for easy testing
      ...(process.env.NODE_ENV === 'development' && { verificationUrl })
    })
  } catch (error: any) {
    console.error('Send verification error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send verification email' },
      { status: 500 }
    )
  }
}
