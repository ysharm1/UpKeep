import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create test provider user
  const hashedPassword = await bcrypt.hash('Test123!', 10)
  
  const provider = await prisma.user.create({
    data: {
      email: 'testprovider@upkeep.com',
      password: hashedPassword,
      role: 'SERVICE_PROVIDER',
      serviceProviderProfile: {
        create: {
          businessName: 'Quick Fix HVAC',
          phoneNumber: '(415) 555-9999',
          specialties: ['hvac'],
          serviceArea: {
            radius: 25,
            zipCodes: ['94102', '94103', '94104', '94105'],
          },
          diagnosticFee: 89.00,
          isVerified: true,
          isActive: true,
          rating: 4.8,
          reviewCount: 42,
        },
      },
    },
  })

  console.log('✅ Test provider created:', provider.email)
  console.log('   Business: Quick Fix HVAC')
  console.log('   Diagnostic Fee: $89')
  console.log('   Password: Test123!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
