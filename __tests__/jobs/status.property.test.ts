import { PrismaClient, UserRole, ServiceCategory, JobStatus } from '@prisma/client'
import { JobService } from '@/lib/jobs/job.service'
import { AuthService } from '@/lib/auth/auth.service'

const prisma = new PrismaClient()
const jobService = new JobService()
const authService = new AuthService()

// Feature: upkeep-platform, Property 10: Job status transitions are valid
describe('Job Status Transition Property Tests', () => {
  let testHomeownerId: string

  beforeAll(async () => {
    const user = await authService.register({
      email: 'statustest@example.com',
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
    await prisma.jobRequest.deleteMany()
    await prisma.address.deleteMany()
    await prisma.homeownerProfile.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  // Property 10: Job status transitions are valid
  it('should follow valid state machine transitions', async () => {
    // Create job
    const job = await jobService.createJobRequest({
      homeownerId: testHomeownerId,
      category: ServiceCategory.plumbing,
      description: 'Test job for status transitions',
      location: {
        street: '123 Test St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        latitude: 37.7749,
        longitude: -122.4194,
      },
    })

    expect(job.status).toBe(JobStatus.submitted)

    // submitted → ai_diagnosis
    const job1 = await jobService.updateJobStatus(job.id, JobStatus.ai_diagnosis)
    expect(job1.status).toBe(JobStatus.ai_diagnosis)

    // ai_diagnosis → pending_match
    const job2 = await jobService.updateJobStatus(job.id, JobStatus.pending_match)
    expect(job2.status).toBe(JobStatus.pending_match)

    // pending_match → matched
    const job3 = await jobService.updateJobStatus(job.id, JobStatus.matched)
    expect(job3.status).toBe(JobStatus.matched)

    // matched → accepted
    const job4 = await jobService.updateJobStatus(job.id, JobStatus.accepted)
    expect(job4.status).toBe(JobStatus.accepted)

    // accepted → in_progress
    const job5 = await jobService.updateJobStatus(job.id, JobStatus.in_progress)
    expect(job5.status).toBe(JobStatus.in_progress)

    // in_progress → completed
    const job6 = await jobService.updateJobStatus(job.id, JobStatus.completed)
    expect(job6.status).toBe(JobStatus.completed)

    await prisma.jobRequest.delete({ where: { id: job.id } })
  })

  it('should allow ai_diagnosis → resolved_diy transition', async () => {
    const job = await jobService.createJobRequest({
      homeownerId: testHomeownerId,
      category: ServiceCategory.plumbing,
      description: 'Test job for DIY resolution',
      location: {
        street: '123 Test St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        latitude: 37.7749,
        longitude: -122.4194,
      },
    })

    await jobService.updateJobStatus(job.id, JobStatus.ai_diagnosis)
    const resolvedJob = await jobService.updateJobStatus(job.id, JobStatus.resolved_diy)
    
    expect(resolvedJob.status).toBe(JobStatus.resolved_diy)

    await prisma.jobRequest.delete({ where: { id: job.id } })
  })

  it('should allow cancelled from any state', async () => {
    const statuses = [
      JobStatus.submitted,
      JobStatus.ai_diagnosis,
      JobStatus.pending_match,
      JobStatus.matched,
      JobStatus.accepted,
      JobStatus.in_progress,
    ]

    for (const status of statuses) {
      const job = await jobService.createJobRequest({
        homeownerId: testHomeownerId,
        category: ServiceCategory.plumbing,
        description: `Test job for cancel from ${status}`,
        location: {
          street: '123 Test St',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94102',
          latitude: 37.7749,
          longitude: -122.4194,
        },
      })

      // Move to target status
      if (status !== JobStatus.submitted) {
        await prisma.jobRequest.update({
          where: { id: job.id },
          data: { status },
        })
      }

      // Cancel from this status
      const cancelledJob = await jobService.updateJobStatus(job.id, JobStatus.cancelled)
      expect(cancelledJob.status).toBe(JobStatus.cancelled)

      await prisma.jobRequest.delete({ where: { id: job.id } })
    }
  })

  it('should reject invalid status transitions', async () => {
    const job = await jobService.createJobRequest({
      homeownerId: testHomeownerId,
      category: ServiceCategory.plumbing,
      description: 'Test job for invalid transitions',
      location: {
        street: '123 Test St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        latitude: 37.7749,
        longitude: -122.4194,
      },
    })

    // submitted → completed (invalid, skips steps)
    await expect(
      jobService.updateJobStatus(job.id, JobStatus.completed)
    ).rejects.toThrow('Invalid status transition')

    // submitted → matched (invalid, skips ai_diagnosis)
    await expect(
      jobService.updateJobStatus(job.id, JobStatus.matched)
    ).rejects.toThrow('Invalid status transition')

    await prisma.jobRequest.delete({ where: { id: job.id } })
  })

  it('should reject transitions from terminal states', async () => {
    // Test completed → any other status
    const completedJob = await jobService.createJobRequest({
      homeownerId: testHomeownerId,
      category: ServiceCategory.plumbing,
      description: 'Test completed terminal state',
      location: {
        street: '123 Test St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        latitude: 37.7749,
        longitude: -122.4194,
      },
    })

    await prisma.jobRequest.update({
      where: { id: completedJob.id },
      data: { status: JobStatus.completed },
    })

    await expect(
      jobService.updateJobStatus(completedJob.id, JobStatus.in_progress)
    ).rejects.toThrow('Invalid status transition')

    await prisma.jobRequest.delete({ where: { id: completedJob.id } })

    // Test resolved_diy → any other status
    const resolvedJob = await jobService.createJobRequest({
      homeownerId: testHomeownerId,
      category: ServiceCategory.plumbing,
      description: 'Test resolved_diy terminal state',
      location: {
        street: '123 Test St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        latitude: 37.7749,
        longitude: -122.4194,
      },
    })

    await prisma.jobRequest.update({
      where: { id: resolvedJob.id },
      data: { status: JobStatus.resolved_diy },
    })

    await expect(
      jobService.updateJobStatus(resolvedJob.id, JobStatus.pending_match)
    ).rejects.toThrow('Invalid status transition')

    await prisma.jobRequest.delete({ where: { id: resolvedJob.id } })
  })
})
