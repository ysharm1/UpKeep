import { NextRequest, NextResponse } from 'next/server'
import { authService } from './auth.service'
import { UserRole } from '@prisma/client'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    role: UserRole
  }
}

/**
 * Middleware to validate JWT tokens on protected endpoints
 * Requirements: 1.4
 */
export async function authMiddleware(request: NextRequest): Promise<NextResponse | null> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Validate token
    const user = await authService.validateSession(token)

    // Attach user to request (for Next.js API routes, this would be done differently)
    // In Next.js 14 App Router, we'll use headers to pass user info
    const response = NextResponse.next()
    response.headers.set('x-user-id', user.id)
    response.headers.set('x-user-email', user.email)
    response.headers.set('x-user-role', user.role)

    return null // Allow request to proceed
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    )
  }
}

/**
 * Helper function to extract user from request headers
 */
export function getUserFromRequest(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userEmail = request.headers.get('x-user-email')
  const userRole = request.headers.get('x-user-role') as UserRole

  if (!userId || !userEmail || !userRole) {
    return null
  }

  return {
    id: userId,
    email: userEmail,
    role: userRole,
  }
}

/**
 * Require authentication for API route
 */
export async function requireAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized')
  }

  const token = authHeader.substring(7)
  const user = await authService.validateSession(token)

  return user
}

/**
 * Require specific role for API route
 */
export async function requireRole(request: NextRequest, allowedRoles: UserRole[]) {
  const user = await requireAuth(request)

  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden: Insufficient permissions')
  }

  return user
}

/**
 * Verify authentication and return user info
 * Used by API routes to check if user is authenticated
 */
export async function verifyAuth(request: NextRequest): Promise<{
  authenticated: boolean
  userId?: string
  userEmail?: string
  userRole?: UserRole
}> {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false }
    }

    const token = authHeader.substring(7)
    const user = await authService.validateSession(token)

    return {
      authenticated: true,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
    }
  } catch (error) {
    return { authenticated: false }
  }
}
