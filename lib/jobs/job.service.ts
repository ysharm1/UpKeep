import { JobRequest, JobStatus, ServiceCategory } from '@prisma/client'
import { prisma } from '../prisma'

export interface CreateJobRequestData {
  homeownerId: string
  category: ServiceCategory
  description: string
  location: {
    street: string
    city: string
    state: string
    zipCode: string
    latitude: number
    longitude: number
  }
  mediaFileIds?: string[]
}

export interface JobFilters {
  status?: JobStatus
  category?: ServiceCategory
  startDate?: Date
  endDate?: Date
}

export class JobService {
  /**
   * Create a new job request
   * Requirements: 2.1, 2.3
   */
  async createJobRequest(data: CreateJobRequestData): Promise<JobRequest> {
    const { homeownerId, category, description, location, mediaFileIds } = data

    // Validate description length (minimum 10 characters)
    if (description.length < 10) {
      throw new Error('Description must be at least 10 characters long')
    }

    if (description.length > 2000) {
      throw new Error('Description must not exceed 2000 characters')
    }

    // Create or find address
    const address = await prisma.address.create({
      data: location,
    })

    // Create job request
    const jobRequest = await prisma.jobRequest.create({
      data: {
        homeownerId,
        category,
        description,
        locationId: address.id,
        status: JobStatus.submitted,
      },
      include: {
        location: true,
        homeowner: true,
        mediaFiles: true,
      },
    })

    // Associate media files if provided
    if (mediaFileIds && mediaFileIds.length > 0) {
      await prisma.mediaFile.updateMany({
        where: {
          id: { in: mediaFileIds },
        },
        data: {
          jobRequestId: jobRequest.id,
        },
      })
    }

    return jobRequest
  }

  /**
   * Get job request by ID
   * Requirements: 10.5
   */
  async getJobRequest(jobId: string): Promise<JobRequest | null> {
    const jobRequest = await prisma.jobRequest.findUnique({
      where: { id: jobId },
      include: {
        location: true,
        homeowner: {
          include: {
            user: {
              select: {
                email: true,
                role: true,
              },
            },
          },
        },
        serviceProvider: {
          include: {
            user: {
              select: {
                email: true,
                role: true,
              },
            },
          },
        },
        mediaFiles: true,
        conversation: {
          include: {
            messages: true,
          },
        },
        messageThread: {
          include: {
            messages: true,
          },
        },
        ratings: true,
        payment: true,
      },
    })

    return jobRequest
  }

  /**
   * Update job status
   * Requirements: 2.6, 2.7, 5.3, 5.7
   */
  async updateJobStatus(jobId: string, newStatus: JobStatus): Promise<JobRequest> {
    const jobRequest = await this.getJobRequest(jobId)

    if (!jobRequest) {
      throw new Error('Job request not found')
    }

    // Validate status transition
    this.validateStatusTransition(jobRequest.status, newStatus)

    const updatedJob = await prisma.jobRequest.update({
      where: { id: jobId },
      data: { status: newStatus },
      include: {
        location: true,
        homeowner: true,
        serviceProvider: true,
        mediaFiles: true,
      },
    })

    return updatedJob
  }

  /**
   * Validate status transitions according to state machine
   * Requirements: 2.6, 2.7, 5.3, 5.7
   */
  private validateStatusTransition(currentStatus: JobStatus, newStatus: JobStatus): void {
    // Cancelled is allowed from any state
    if (newStatus === JobStatus.cancelled) {
      return
    }

    const validTransitions: Record<JobStatus, JobStatus[]> = {
      [JobStatus.submitted]: [JobStatus.ai_diagnosis],
      [JobStatus.ai_diagnosis]: [JobStatus.resolved_diy, JobStatus.pending_match],
      [JobStatus.resolved_diy]: [], // Terminal state
      [JobStatus.pending_match]: [JobStatus.matched],
      [JobStatus.matched]: [JobStatus.accepted],
      [JobStatus.accepted]: [JobStatus.in_progress],
      [JobStatus.in_progress]: [JobStatus.completed],
      [JobStatus.completed]: [], // Terminal state
      [JobStatus.cancelled]: [], // Terminal state
    }

    const allowedTransitions = validTransitions[currentStatus] || []

    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      )
    }
  }

  /**
   * Assign service provider to job
   * Requirements: 5.1
   */
  async assignServiceProvider(jobId: string, providerId: string): Promise<JobRequest> {
    const jobRequest = await this.getJobRequest(jobId)

    if (!jobRequest) {
      throw new Error('Job request not found')
    }

    if (jobRequest.serviceProviderId) {
      throw new Error('Job already has a service provider assigned')
    }

    const updatedJob = await prisma.jobRequest.update({
      where: { id: jobId },
      data: {
        serviceProviderId: providerId,
        status: JobStatus.matched,
      },
      include: {
        location: true,
        homeowner: true,
        serviceProvider: true,
        mediaFiles: true,
      },
    })

    return updatedJob
  }

  /**
   * Cancel job
   * Requirements: 5.7
   */
  async cancelJob(jobId: string, userId: string, reason: string): Promise<JobRequest> {
    const jobRequest = await this.getJobRequest(jobId)

    if (!jobRequest) {
      throw new Error('Job request not found')
    }

    // Verify user is authorized to cancel (homeowner or assigned provider)
    const isHomeowner = jobRequest.homeownerId === userId
    const isProvider = jobRequest.serviceProviderId === userId

    if (!isHomeowner && !isProvider) {
      throw new Error('Unauthorized to cancel this job')
    }

    const updatedJob = await prisma.jobRequest.update({
      where: { id: jobId },
      data: { status: JobStatus.cancelled },
      include: {
        location: true,
        homeowner: true,
        serviceProvider: true,
        mediaFiles: true,
      },
    })

    return updatedJob
  }

  /**
   * Complete job (by service provider)
   * Requirements: 8.4
   */
  async completeJob(jobId: string, providerId: string): Promise<JobRequest> {
    const jobRequest = await this.getJobRequest(jobId)

    if (!jobRequest) {
      throw new Error('Job request not found')
    }

    if (jobRequest.serviceProviderId !== providerId) {
      throw new Error('Only the assigned service provider can mark job as complete')
    }

    if (jobRequest.status !== JobStatus.in_progress) {
      throw new Error('Job must be in progress to be completed')
    }

    const updatedJob = await prisma.jobRequest.update({
      where: { id: jobId },
      data: { status: JobStatus.completed },
      include: {
        location: true,
        homeowner: true,
        serviceProvider: true,
        mediaFiles: true,
      },
    })

    return updatedJob
  }

  /**
   * Confirm job completion (by homeowner)
   * Requirements: 8.4
   */
  async confirmCompletion(jobId: string, homeownerId: string): Promise<JobRequest> {
    const jobRequest = await this.getJobRequest(jobId)

    if (!jobRequest) {
      throw new Error('Job request not found')
    }

    if (jobRequest.homeownerId !== homeownerId) {
      throw new Error('Only the homeowner can confirm completion')
    }

    if (jobRequest.status !== JobStatus.completed) {
      throw new Error('Job must be marked as completed by provider first')
    }

    // Job is already completed, this is just confirmation
    // In a real system, this might trigger payment capture
    return jobRequest
  }

  /**
   * Get job history with filters
   * Requirements: 10.1, 10.2, 10.3, 10.4
   */
  async getJobHistory(userId: string, filters: JobFilters = {}): Promise<JobRequest[]> {
    const { status, category, startDate, endDate } = filters

    const where: any = {
      OR: [{ homeownerId: userId }, { serviceProviderId: userId }],
    }

    if (status) {
      where.status = status
    }

    if (category) {
      where.category = category
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = startDate
      }
      if (endDate) {
        where.createdAt.lte = endDate
      }
    }

    const jobRequests = await prisma.jobRequest.findMany({
      where,
      include: {
        location: true,
        homeowner: true,
        serviceProvider: true,
        mediaFiles: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return jobRequests
  }
}

export const jobService = new JobService()
