import fc from 'fast-check'
import { PrismaClient, UserRole } from '@prisma/client'
import { AuthService } from '@/lib/auth/auth.service'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const authService = new AuthService()

// Feature: upkeep-platform, Property 2, 3, 4: Session management
describe('Session Management Property Tests', () => {
  beforeEach(async () => {
    await prisma.refreshToken.deleteMany()
    await prisma.homeownerProfile.deleteMany()
    await prisma.serviceProviderProfile.deleteMany()
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  // Property 2: Valid authentication creates sessions
  it('should create valid session tokens for registered users with valid credentials', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc
          .string({ minLength: 8, maxLength: 50 })
          .filter(s => /[A-Z]/.test(s) && /[a-z]/.test(s) && /[0-9]/.test(s)),
        async (email, password) => {
          try {
            // Register user
            const user = await authService.register({
              email,
              password,
              role: UserRole.homeowner,
              profileData: {
                firstName: 'Test',
                lastName: 'User',
                phoneNumber: '+11234567890',
              },
            })

            // Login with valid credentials
            const authToken = await authService.login(email, password)

            // Verify tokens are created
            expect(authToken.accessToken).toBeDefined()
            expect(authToken.refreshToken).toBeDefined()
            expect(authToken.expiresIn).toBe(15 * 60) // 15 minutes

            // Verify access token can be used for subsequent requests
            const validatedUser = await authService.validateSession(authToken.accessToken)
            expect(validatedUser.id).toBe(user.id)
            expect(validatedUser.email).toBe(email)

            // Clean up
            await prisma.user.delete({ where: { id: user.id } })
          } catch (error: any) {
            if (!error.message.includes('already exists')) {
              throw error
            }
          }
        }
      ),
      { numRuns: 30 }
    )
  }, 60000)

  // Property 3: Invalid credentials are rejected
  it('should reject invalid credential combinations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc
          .string({ minLength: 8, maxLength: 50 })
          .filter(s => /[A-Z]/.test(s) && /[a-z]/.test(s) && /[0-9]/.test(s)),
        fc
          .string({ minLength: 8, maxLength: 50 })
          .filter(s => /[A-Z]/.test(s) && /[a-z]/.test(s) && /[0-9]/.test(s)),
        async (email, correctPassword, wrongPassword) => {
          // Skip if passwords are the same
          if (correctPassword === wrongPassword) return

          try {
            // Register user
            const user = await authService.register({
              email,
              password: correctPassword,
              role: UserRole.homeowner,
              profileData: {
                firstName: 'Test',
                lastName: 'User',
                phoneNumber: '+11234567890',
              },
            })

            // Try to login with wrong password
            await expect(authService.login(email, wrongPassword)).rejects.toThrow(
              'Invalid credentials'
            )

            // Try to login with non-existent email
            await expect(
              authService.login('nonexistent@example.com', correctPassword)
            ).rejects.toThrow('Invalid credentials')

            // Clean up
            await prisma.user.delete({ where: { id: user.id } })
          } catch (error: any) {
            if (!error.message.includes('already exists')) {
              throw error
            }
          }
        }
      ),
      { numRuns: 30 }
    )
  }, 60000)

  // Property 4: Expired sessions require re-authentication
  it('should reject expired session tokens', async () => {
    const email = 'expired@example.com'
    const password = 'Password123'

    // Register user
    const user = await authService.register({
      email,
      password,
      role: UserRole.homeowner,
      profileData: {
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+11234567890',
      },
    })

    // Create an expired token (manually)
    const expiredToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'dev-secret-key',
      { expiresIn: '0s' } // Expired immediately
    )

    // Wait a moment to ensure expiration
    await new Promise(resolve => setTimeout(resolve, 100))

    // Try to validate expired token
    await expect(authService.validateSession(expiredToken)).rejects.toThrow(
      'Invalid or expired token'
    )

    // Clean up
    await prisma.user.delete({ where: { id: user.id } })
  })

  // Test refresh token functionality
  it('should allow token refresh with valid refresh token', async () => {
    const email = 'refresh@example.com'
    const password = 'Password123'

    // Register and login
    const user = await authService.register({
      email,
      password,
      role: UserRole.homeowner,
      profileData: {
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+11234567890',
      },
    })

    const authToken = await authService.login(email, password)

    // Refresh token
    const newAuthToken = await authService.refreshToken(authToken.refreshToken)

    // Verify new tokens are different
    expect(newAuthToken.accessToken).not.toBe(authToken.accessToken)
    expect(newAuthToken.refreshToken).not.toBe(authToken.refreshToken)

    // Verify new access token works
    const validatedUser = await authService.validateSession(newAuthToken.accessToken)
    expect(validatedUser.id).toBe(user.id)

    // Verify old refresh token no longer works
    await expect(authService.refreshToken(authToken.refreshToken)).rejects.toThrow()

    // Clean up
    await prisma.user.delete({ where: { id: user.id } })
  })

  // Test logout functionality
  it('should invalidate refresh tokens on logout', async () => {
    const email = 'logout@example.com'
    const password = 'Password123'

    // Register and login
    const user = await authService.register({
      email,
      password,
      role: UserRole.homeowner,
      profileData: {
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+11234567890',
      },
    })

    const authToken = await authService.login(email, password)

    // Logout
    await authService.logout(user.id)

    // Verify refresh token no longer works
    await expect(authService.refreshToken(authToken.refreshToken)).rejects.toThrow()

    // Clean up
    await prisma.user.delete({ where: { id: user.id } })
  })
})
