import { PrismaClient, ServiceProviderProfile, ServiceCategory } from '@prisma/client'

const prisma = new PrismaClient()

export interface CreateProviderProfileData {
  userId: string
  businessName: string
  phoneNumber: string
  specialties: ServiceCategory[]
  licenseNumber: string
  serviceArea: {
    centerLocation: {
      street: string
      city: string
      state: string
      zipCode: string
      latitude: number
      longitude: number
    }
    radiusMiles?: number
    zipCodes?: string[]
  }
  profilePhotoUrl?: string
}

export interface UpdateProviderProfileData {
  businessName?: string
  phoneNumber?: string
  specialties?: ServiceCategory[]
  licenseNumber?: string
  profilePhotoUrl?: string
}

export class ProviderService {
  /**
   * Create service provider profile
   * Requirements: 3.1, 9.1, 9.2
   */
  async createProfile(data: CreateProviderProfileData): Promise<ServiceProviderProfile> {
    const { userId, businessName, phoneNumber, specialties, licenseNumber, serviceArea, profilePhotoUrl } = data

    // Validate required fields
    if (!businessName || !phoneNumber || !specialties || specialties.length === 0 || !licenseNumber) {
      throw new Error('Missing required fields: businessName, phoneNumber, specialties, licenseNumber')
    }

    // Validate specialties
    const validSpecialties = Object.values(ServiceCategory)
    for (const specialty of specialties) {
      if (!validSpecialties.includes(specialty)) {
        throw new Error(`Invalid specialty: ${specialty}`)
      }
    }

    // Validate service area format
    if (!serviceArea.radiusMiles && (!serviceArea.zipCodes || serviceArea.zipCodes.length === 0)) {
      throw new Error('Service area must include either radiusMiles or zipCodes')
    }

    // Create address for service area center
    const centerAddress = await prisma.address.create({
      data: serviceArea.centerLocation,
    })

    // Create profile
    const profile = await prisma.serviceProviderProfile.create({
      data: {
        userId,
        businessName,
        phoneNumber,
        specialties,
        licenseNumber,
        verified: false, // Pending verification
        insuranceVerified: false,
        profilePhotoUrl,
        serviceArea: {
          create: {
            centerLocationId: centerAddress.id,
            radiusMiles: serviceArea.radiusMiles,
            zipCodes: serviceArea.zipCodes || [],
          },
        },
      },
      include: {
        user: true,
        serviceArea: {
          include: {
            centerLocation: true,
          },
        },
      },
    })

    return profile
  }

  /**
   * Get provider profile
   * Requirements: 3.7
   */
  async getProfile(profileId: string): Promise<ServiceProviderProfile | null> {
    const profile = await prisma.serviceProviderProfile.findUnique({
      where: { id: profileId },
      include: {
        user: {
          select: {
            email: true,
            role: true,
            createdAt: true,
          },
        },
        serviceArea: {
          include: {
            centerLocation: true,
          },
        },
        jobRequests: {
          where: {
            status: 'completed',
          },
          include: {
            ratings: true,
          },
        },
      },
    })

    return profile
  }

  /**
   * Update provider profile
   * Requirements: 3.6
   */
  async updateProfile(
    profileId: string,
    data: UpdateProviderProfileData
  ): Promise<ServiceProviderProfile> {
    const profile = await prisma.serviceProviderProfile.findUnique({
      where: { id: profileId },
    })

    if (!profile) {
      throw new Error('Profile not found')
    }

    // Validate specialties if provided
    if (data.specialties) {
      const validSpecialties = Object.values(ServiceCategory)
      for (const specialty of data.specialties) {
        if (!validSpecialties.includes(specialty)) {
          throw new Error(`Invalid specialty: ${specialty}`)
        }
      }
    }

    const updatedProfile = await prisma.serviceProviderProfile.update({
      where: { id: profileId },
      data: {
        ...data,
      },
      include: {
        user: true,
        serviceArea: {
          include: {
            centerLocation: true,
          },
        },
      },
    })

    return updatedProfile
  }

  /**
   * Upload verification documents
   * Requirements: 9.1, 9.6
   */
  async uploadVerificationDocument(
    profileId: string,
    documentType: 'license' | 'insurance',
    mediaFileId: string
  ): Promise<void> {
    const profile = await prisma.serviceProviderProfile.findUnique({
      where: { id: profileId },
    })

    if (!profile) {
      throw new Error('Profile not found')
    }

    // In a real system, this would trigger admin review
    // For now, just mark as uploaded
    if (documentType === 'insurance') {
      await prisma.serviceProviderProfile.update({
        where: { id: profileId },
        data: {
          insuranceVerified: false, // Pending review
        },
      })
    }
  }

  /**
   * Verify provider (admin function)
   * Requirements: 9.3
   */
  async verifyProvider(profileId: string): Promise<ServiceProviderProfile> {
    const profile = await prisma.serviceProviderProfile.update({
      where: { id: profileId },
      data: {
        verified: true,
      },
      include: {
        user: true,
        serviceArea: {
          include: {
            centerLocation: true,
          },
        },
      },
    })

    return profile
  }

  /**
   * Get all verified providers
   * Requirements: 9.4
   */
  async getVerifiedProviders(filters?: {
    specialties?: ServiceCategory[]
    zipCode?: string
  }): Promise<ServiceProviderProfile[]> {
    const where: any = {
      verified: true,
    }

    if (filters?.specialties && filters.specialties.length > 0) {
      where.specialties = {
        hasSome: filters.specialties,
      }
    }

    if (filters?.zipCode) {
      where.serviceArea = {
        zipCodes: {
          has: filters.zipCode,
        },
      }
    }

    const providers = await prisma.serviceProviderProfile.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
        serviceArea: {
          include: {
            centerLocation: true,
          },
        },
      },
      orderBy: {
        averageRating: 'desc',
      },
    })

    return providers
  }
}

export const providerService = new ProviderService()
