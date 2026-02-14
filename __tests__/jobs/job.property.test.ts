import fc from 'fast-check'
import { PrismaClient, UserRole, ServiceCategory } from '@prisma/client'
import { JobService } from '@/lib/jobs/job.service'
import { AuthService } from '@/lib/auth/auth.service'

const prisma = new PrismaClient()
const jobService = new JobService()
const authService = new AuthService()

// Feature: upkeep-platform, Property 6: Description length validation
describe('Job Service Property Tests', () => {
  let testHomeownerId: string

  beforeAll(async () => {
    // Create a test homeowner
    const user = await authService.register({
      email: 'jobtest@example.com',
      password: 'Password123',
      role: UserRole.homeowner,
      profileData: {
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+11234567890',
      },
    })
    testHomeownerId = user.homeownerProfile!.id
  })

  afterAll(async () => {
    // Clean up
    await prisma.jobRequest.deleteMany()
    await prisma.address.deleteMany()
    await prisma.homeownerProfile.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  // Property 6: Description length validation
  it('should reject descriptions with fewer than 10 characters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 9 }),
        async (shortDescription) => {
          await expect(
            jobService.createJobRequest({
              homeownerId: testHomeownerId,
              category: ServiceCategory.plumbing,
              description: shortDescription,
              location: {
                street: '123 Test St',
                city: 'San Francisco',
                state: 'CA',
                zipCode: '94102',
                latitude: 37.7749,
                longitude: -122.4194,
              },
            })
          ).rejects.toThrow('Description must be at least 10 characters')
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should accept descriptions with 10 or more characters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 200 }),
        fc.constantFrom(...Object.values(ServiceCategory)),
        async (description, category) => {
          const jobRequest = await jobService.createJobRequest({
            homeownerId: testHomeownerId,
            category,
            description,
            location: {
              street: '123 Test St',
              city: 'San Francisco',
              state: 'CA',
              zipCode: '94102',
              latitude: 37.7749,
              longitude: -122.4194,
            },
          })

          expect(jobRequest.description).toBe(description)
          expect(jobRequest.description.length).toBeGreaterThanOrEqual(10)
          expect(jobRequest.category).toBe(category)
          expect(jobRequest.status).toBe('submitted')

          // Clean up
          await prisma.jobRequest.delete({ where: { id: jobRequest.id } })
        }
      ),
      { numRuns: 30 }
    )
  }, 60000)

  it('should reject descriptions exceeding 2000 characters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 2001, maxLength: 3000 }),
        async (longDescription) => {
          await expect(
            jobService.createJobRequest({
              homeownerId: testHomeownerId,
              category: ServiceCategory.plumbing,
              description: longDescription,
              location: {
                street: '123 Test St',
                city: 'San Francisco',
                state: 'CA',
                zipCode: '94102',
                latitude: 37.7749,
                longitude: -122.4194,
              },
            })
          ).rejects.toThrow('Description must not exceed 2000 characters')
        }
      ),
      { numRuns: 20 }
    )
  })

  // Boundary tests
  it('should accept description with exactly 10 characters', async () => {
    const jobRequest = await jobService.createJobRequest({
      homeownerId: testHomeownerId,
      category: ServiceCategory.plumbing,
      description: '1234567890', // Exactly 10 characters
      location: {
        street: '123 Test St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        latitude: 37.7749,
        longitude: -122.4194,
      },
    })

    expect(jobRequest.description).toBe('1234567890')
    expect(jobRequest.description.length).toBe(10)

    await prisma.jobRequest.delete({ where: { id: jobRequest.id } })
  })

  it('should accept description with exactly 2000 characters', async () => {
    const description = 'a'.repeat(2000)
    const jobRequest = await jobService.createJobRequest({
      homeownerId: testHomeownerId,
      category: ServiceCategory.plumbing,
      description,
      location: {
        street: '123 Test St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        latitude: 37.7749,
        longitude: -122.4194,
      },
    })

    expect(jobRequest.description.length).toBe(2000)

    await prisma.jobRequest.delete({ where: { id: jobRequest.id } })
  })

  it('should reject description with 9 characters', async () => {
    await expect(
      jobService.createJobRequest({
        homeownerId: testHomeownerId,
        category: ServiceCategory.plumbing,
        description: '123456789', // 9 characters
        location: {
          street: '123 Test St',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94102',
          latitude: 37.7749,
          longitude: -122.4194,
        },
      })
    ).rejects.toThrow('Description must be at least 10 characters')
  })

  it('should reject description with 2001 characters', async () => {
    const description = 'a'.repeat(2001)
    await expect(
      jobService.createJobRequest({
        homeownerId: testHomeownerId,
        category: ServiceCategory.plumbing,
        description,
        location: {
          street: '123 Test St',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94102',
          latitude: 37.7749,
          longitude: -122.4194,
        },
      })
    ).rejects.toThrow('Description must not exceed 2000 characters')
  })
})
