import { Coordinates, calculateDistance } from './geocoding'

// Partner configuration for PAY-TO-PLAY competitive lead generation model
// Multiple partners compete for each lead

export interface Partner {
  id: string
  name: string
  email: string
  phone: string
  categories: string[] // ServiceCategory values they handle
  serviceArea: {
    city: string
    state: string
    radius: number // miles
    latitude?: number // Optional: for distance calculation
    longitude?: number
  }
  active: boolean
  stripeCustomerId?: string // For charging them
}

// SHARED LEAD MODEL:
// - Multiple vendors can purchase the same lead
// - Pricing: $40 (residential), $60 (multi-family), $80 (commercial)
// - Revenue: 3-5 vendors × price = $120-400 per lead

// CONFIGURATION: Add your partner details here
export const PARTNERS: Partner[] = [
  // Example partners - replace with real partner info
  {
    id: 'partner-1',
    name: 'ABC HVAC Services',
    email: 'leads@abchvac.com', // Replace with real email
    phone: '+14805550100', // MUST be E.164 format: +1 (country) + area code + number
    categories: ['hvac'],
    serviceArea: {
      city: 'Phoenix',
      state: 'AZ',
      radius: 25,
    },
    active: true,
  },
  {
    id: 'partner-2',
    name: 'Quick Fix HVAC',
    email: 'leads@quickfixhvac.com',
    phone: '+14805550101', // MUST be E.164 format
    categories: ['hvac'],
    serviceArea: {
      city: 'Phoenix',
      state: 'AZ',
      radius: 25,
    },
    active: true,
  },
  {
    id: 'partner-3',
    name: 'Cool Air Pros',
    email: 'leads@coolairpros.com',
    phone: '+14805550102', // MUST be E.164 format
    categories: ['hvac'],
    serviceArea: {
      city: 'Phoenix',
      state: 'AZ',
      radius: 25,
    },
    active: true,
  },
]

// Find ALL partners for a given service category (for competitive bidding)
export function findPartnersForCategory(category: string): Partner[] {
  return PARTNERS.filter(
    (p) => p.active && p.categories.includes(category.toLowerCase())
  )
}

// Find partners within service radius of a job location
export function findPartnersNearLocation(
  category: string,
  jobLocation: Coordinates
): Partner[] {
  const allPartners = findPartnersForCategory(category)
  
  // If no job coordinates, return all partners (fallback)
  if (!jobLocation.latitude || !jobLocation.longitude) {
    console.warn('⚠️ No job coordinates provided, returning all partners')
    return allPartners
  }

  // Filter by distance
  const nearbyPartners = allPartners.filter((partner) => {
    // If partner has no coordinates, include them (fallback)
    if (!partner.serviceArea.latitude || !partner.serviceArea.longitude) {
      console.warn(`⚠️ Partner ${partner.name} has no coordinates, including anyway`)
      return true
    }

    const distance = calculateDistance(
      { latitude: partner.serviceArea.latitude, longitude: partner.serviceArea.longitude },
      jobLocation
    )

    const withinRadius = distance <= partner.serviceArea.radius
    
    if (withinRadius) {
      console.log(`✅ Partner ${partner.name} is ${distance} miles away (within ${partner.serviceArea.radius} mile radius)`)
    } else {
      console.log(`❌ Partner ${partner.name} is ${distance} miles away (outside ${partner.serviceArea.radius} mile radius)`)
    }

    return withinRadius
  })

  console.log(`📍 Found ${nearbyPartners.length} partners within service area for ${category}`)
  return nearbyPartners
}

// Get all active partners
export function getActivePartners(): Partner[] {
  return PARTNERS.filter((p) => p.active)
}

// Get partner by ID
export function getPartnerById(id: string): Partner | null {
  return PARTNERS.find((p) => p.id === id) || null
}
