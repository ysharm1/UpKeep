import { PrismaClient, UserRole, ServiceCategory, JobStatus } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create homeowner user
  const homeownerPasswordHash = await bcrypt.hash('password123', 12)
  const homeowner = await prisma.user.create({
    data: {
      email: 'homeowner@example.com',
      passwordHash: homeownerPasswordHash,
      role: UserRole.homeowner,
      emailVerified: true,
      homeownerProfile: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '+11234567890',
          address: {
            create: {
              street: '123 Main St',
              city: 'San Francisco',
              state: 'CA',
              zipCode: '94102',
              latitude: 37.7749,
              longitude: -122.4194,
            },
          },
        },
      },
    },
  })

  console.log('✅ Created homeowner:', homeowner.email)

  // Create service provider users
  const providerPasswordHash = await bcrypt.hash('password123', 12)
  
  const plumber = await prisma.user.create({
    data: {
      email: 'plumber@example.com',
      passwordHash: providerPasswordHash,
      role: UserRole.service_provider,
      emailVerified: true,
      serviceProviderProfile: {
        create: {
          businessName: 'Quick Fix Plumbing',
          phoneNumber: '+11234567891',
          specialties: [ServiceCategory.plumbing],
          licenseNumber: 'PL-12345',
          verified: true,
          insuranceVerified: true,
          averageRating: 4.8,
          reviewCount: 42,
          serviceArea: {
            create: {
              radiusMiles: 25,
              zipCodes: ['94102', '94103', '94104', '94105'],
              centerLocation: {
                create: {
                  street: '456 Service Ave',
                  city: 'San Francisco',
                  state: 'CA',
                  zipCode: '94103',
                  latitude: 37.7749,
                  longitude: -122.4194,
                },
              },
            },
          },
        },
      },
    },
  })

  console.log('✅ Created plumber:', plumber.email)

  const hvacTech = await prisma.user.create({
    data: {
      email: 'hvac@example.com',
      passwordHash: providerPasswordHash,
      role: UserRole.service_provider,
      emailVerified: true,
      serviceProviderProfile: {
        create: {
          businessName: 'Cool Air HVAC',
          phoneNumber: '+11234567892',
          specialties: [ServiceCategory.hvac],
          licenseNumber: 'HVAC-67890',
          verified: true,
          insuranceVerified: true,
          averageRating: 4.9,
          reviewCount: 38,
          serviceArea: {
            create: {
              radiusMiles: 30,
              zipCodes: ['94102', '94103', '94104', '94105', '94107'],
              centerLocation: {
                create: {
                  street: '789 Tech Blvd',
                  city: 'San Francisco',
                  state: 'CA',
                  zipCode: '94107',
                  latitude: 37.7749,
                  longitude: -122.4194,
                },
              },
            },
          },
        },
      },
    },
  })

  console.log('✅ Created HVAC tech:', hvacTech.email)

  const electrician = await prisma.user.create({
    data: {
      email: 'electrician@example.com',
      passwordHash: providerPasswordHash,
      role: UserRole.service_provider,
      emailVerified: true,
      serviceProviderProfile: {
        create: {
          businessName: 'Bright Spark Electric',
          phoneNumber: '+11234567893',
          specialties: [ServiceCategory.electrical],
          licenseNumber: 'EL-54321',
          verified: true,
          insuranceVerified: false,
          averageRating: 4.7,
          reviewCount: 29,
          serviceArea: {
            create: {
              radiusMiles: 20,
              zipCodes: ['94102', '94103'],
              centerLocation: {
                create: {
                  street: '321 Power St',
                  city: 'San Francisco',
                  state: 'CA',
                  zipCode: '94102',
                  latitude: 37.7749,
                  longitude: -122.4194,
                },
              },
            },
          },
        },
      },
    },
  })

  console.log('✅ Created electrician:', electrician.email)

  console.log('🎉 Seeding completed!')
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
