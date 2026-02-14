import { PrismaClient, UserRole, User } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

const SALT_ROUNDS = 12
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key'
const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '7d'

export interface AuthToken {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface RegisterData {
  email: string
  password: string
  role: UserRole
  profileData?: {
    firstName?: string
    lastName?: string
    phoneNumber?: string
    businessName?: string
  }
}

export class AuthService {
  /**
   * Register a new user with hashed password
   * Requirements: 1.1, 1.5
   */
  async register(data: RegisterData): Promise<User> {
    const { email, password, role, profileData } = data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }

    // Hash password with bcrypt (salt rounds: 12)
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    // Create user with profile based on role
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        emailVerified: false,
        ...(role === UserRole.homeowner && {
          homeownerProfile: {
            create: {
              firstName: profileData?.firstName || '',
              lastName: profileData?.lastName || '',
              phoneNumber: profileData?.phoneNumber || '',
            },
          },
        }),
        ...(role === UserRole.service_provider && {
          serviceProviderProfile: {
            create: {
              businessName: profileData?.businessName || '',
              phoneNumber: profileData?.phoneNumber || '',
              specialties: [],
              licenseNumber: '',
              verified: false,
            },
          },
        }),
      },
      include: {
        homeownerProfile: true,
        serviceProviderProfile: true,
      },
    })

    return user
  }

  /**
   * Authenticate user and create session tokens
   * Requirements: 1.2
   */
  async login(email: string, password: string): Promise<AuthToken> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw new Error('Invalid credentials')
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      throw new Error('Invalid credentials')
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    )

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    )

    // Store refresh token in database
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    })

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    }
  }

  /**
   * Logout user by invalidating refresh token
   * Requirements: 1.2
   */
  async logout(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    })
  }

  /**
   * Refresh access token using refresh token
   * Requirements: 1.4
   */
  async refreshToken(refreshToken: string): Promise<AuthToken> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {
        userId: string
        email: string
        role: UserRole
      }

      // Check if refresh token exists in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      })

      if (!storedToken) {
        throw new Error('Invalid refresh token')
      }

      // Check if token is expired
      if (storedToken.expiresAt < new Date()) {
        await prisma.refreshToken.delete({
          where: { token: refreshToken },
        })
        throw new Error('Refresh token expired')
      }

      // Generate new access token
      const accessToken = jwt.sign(
        { userId: decoded.userId, email: decoded.email, role: decoded.role },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      )

      // Generate new refresh token
      const newRefreshToken = jwt.sign(
        { userId: decoded.userId, email: decoded.email, role: decoded.role },
        JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
      )

      // Delete old refresh token and create new one
      await prisma.refreshToken.delete({
        where: { token: refreshToken },
      })

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      await prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: decoded.userId,
          expiresAt,
        },
      })

      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60,
      }
    } catch (error) {
      throw new Error('Invalid or expired refresh token')
    }
  }

  /**
   * Validate session token and return user
   * Requirements: 1.4
   */
  async validateSession(token: string): Promise<User> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string
        email: string
        role: UserRole
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          homeownerProfile: true,
          serviceProviderProfile: true,
        },
      })

      if (!user) {
        throw new Error('User not found')
      }

      return user
    } catch (error) {
      throw new Error('Invalid or expired token')
    }
  }

  /**
   * Request password reset
   * Requirements: 1.6
   */
  async requestPasswordReset(email: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Don't reveal if user exists
      return 'If an account exists, a reset link has been sent'
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '1h',
    })

    // In production, send email with reset link
    // For now, return the token
    return resetToken
  }

  /**
   * Reset password using reset token
   * Requirements: 1.6
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string
        email: string
      }

      // Validate new password
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long')
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)

      // Update user password
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { passwordHash },
      })

      // Invalidate all refresh tokens for security
      await prisma.refreshToken.deleteMany({
        where: { userId: decoded.userId },
      })
    } catch (error) {
      throw new Error('Invalid or expired reset token')
    }
  }
}

export const authService = new AuthService()
