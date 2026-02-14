import fc from 'fast-check'
import { PrismaClient, UserRole } from '@prisma/client'
import { AuthService } from '@/lib/auth/auth.service'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()
const authService = new AuthService()

// Feature: upkeep-platform, Property 1: Account creation completeness
describe('Authentication Property Tests', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.refreshToken.deleteMany()
    await prisma.homeownerProfile.deleteMany()
    await prisma.serviceProviderProfile.deleteMany()
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  // Property 1: Account creation completeness
  it('should create complete user accounts for valid registration data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc
          .string({ minLength: 8, maxLength: 50 })
          .filter(s => /[A-Z]/.test(s) && /[a-z]/.test(s) && /[0-9]/.test(s)),
        fc.constantFrom(UserRole.homeowner, UserRole.service_provider),
        async (email, password, role) => {
          try {
            const user = await authService.register({
              email,
              password,
              role,
              profileData: {
                firstName: 'Test',
                lastName: 'User',
                phoneNumber: '+11234567890',
                businessName: 'Test Business',
              },
            })

            // Verify all required fields are populated
            expect(user.email).toBe(email)
            expect(user.role).toBe(role)
            expect(user.passwordHash).toBeDefined()
            expect(user.passwordHash).not.toBe(password)
            expect(user.id).toBeDefined()
            expect(user.createdAt).toBeInstanceOf(Date)

            // Verify password is properly hashed
            const isPasswordHashed = await bcrypt.compare(password, user.passwordHash)
            expect(isPasswordHashed).toBe(true)

            // Verify profile is created based on role
            if (role === UserRole.homeowner) {
              expect(user.homeownerProfile).toBeDefined()
            } else if (role === UserRole.service_provider) {
              expect(user.serviceProviderProfile).toBeDefined()
            }

            // Clean up
            await prisma.user.delete({ where: { id: user.id } })
          } catch (error: any) {
            // If error is due to duplicate email, that's expected in property testing
            if (!error.message.includes('already exists')) {
              throw error
            }
          }
        }
      ),
      { numRuns: 50 } // Reduced runs for database operations
    )
  }, 60000)

  // Property 5: Password reset round trip
  it('should allow password reset with valid token', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc
          .string({ minLength: 8, maxLength: 50 })
          .filter(s => /[A-Z]/.test(s) && /[a-z]/.test(s) && /[0-9]/.test(s)),
        fc
          .string({ minLength: 8, maxLength: 50 })
          .filter(s => /[A-Z]/.test(s) && /[a-z]/.test(s) && /[0-9]/.test(s)),
        async (email, oldPassword, newPassword) => {
          try {
            // Register user
            const user = await authService.register({
              email,
              password: oldPassword,
              role: UserRole.homeowner,
              profileData: {
                firstName: 'Test',
                lastName: 'User',
                phoneNumber: '+11234567890',
              },
            })

            // Request password reset
            const resetToken = await authService.requestPasswordReset(email)
            expect(resetToken).toBeDefined()

            // Reset password
            await authService.resetPassword(resetToken, newPassword)

            // Verify new password works
            const authToken = await authService.login(email, newPassword)
            expect(authToken.accessToken).toBeDefined()
            expect(authToken.refreshToken).toBeDefined()

            // Verify old password doesn't work
            await expect(authService.login(email, oldPassword)).rejects.toThrow()

            // Clean up
            await prisma.user.delete({ where: { id: user.id } })
          } catch (error: any) {
            if (!error.message.includes('already exists')) {
              throw error
            }
          }
        }
      ),
      { numRuns: 20 }
    )
  }, 60000)

  // Additional validation tests
  it('should reject passwords shorter than 8 characters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 1, maxLength: 7 }),
        async (email, shortPassword) => {
          await expect(
            authService.register({
              email,
              password: shortPassword,
              role: UserRole.homeowner,
            })
          ).rejects.toThrow('Password must be at least 8 characters')
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should reject duplicate email registrations', async () => {
    const email = 'duplicate@example.com'
    const password = 'Password123'

    // Register first user
    await authService.register({
      email,
      password,
      role: UserRole.homeowner,
      profileData: {
        firstName: 'First',
        lastName: 'User',
        phoneNumber: '+11234567890',
      },
    })

    // Try to register with same email
    await expect(
      authService.register({
        email,
        password,
        role: UserRole.service_provider,
      })
    ).rejects.toThrow('already exists')

    // Clean up
    await prisma.user.delete({ where: { email } })
  })
})
