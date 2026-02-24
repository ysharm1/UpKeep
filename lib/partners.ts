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
  }
  active: boolean
  viewFee: number // Amount they pay to see a lead ($15)
  acceptFee: number // Amount they pay to accept lead ($50)
  stripeCustomerId?: string // For charging them
}

// PRICING MODEL:
// - All partners pay $15 to view the lead details
// - First to accept pays $50 to get exclusive access
// - Total cost for winner: $65
// - Total cost for losers: $15
// - Your revenue: $45 (3 × $15) + $50 (accept) = $95 per lead

// CONFIGURATION: Add your partner details here
export const PARTNERS: Partner[] = [
  // Example partners - replace with real partner info
  {
    id: 'partner-1',
    name: 'ABC HVAC Services',
    email: 'leads@abchvac.com', // Replace with real email
    phone: '555-0100',
    categories: ['hvac'],
    serviceArea: {
      city: 'Phoenix',
      state: 'AZ',
      radius: 25,
    },
    active: true,
    viewFee: 15,
    acceptFee: 50,
  },
  {
    id: 'partner-2',
    name: 'Quick Fix HVAC',
    email: 'leads@quickfixhvac.com',
    phone: '555-0101',
    categories: ['hvac'],
    serviceArea: {
      city: 'Phoenix',
      state: 'AZ',
      radius: 25,
    },
    active: true,
    viewFee: 15,
    acceptFee: 50,
  },
  {
    id: 'partner-3',
    name: 'Cool Air Pros',
    email: 'leads@coolairpros.com',
    phone: '555-0102',
    categories: ['hvac'],
    serviceArea: {
      city: 'Phoenix',
      state: 'AZ',
      radius: 25,
    },
    active: true,
    viewFee: 15,
    acceptFee: 50,
  },
  // Add more partners for other categories
  // {
  //   id: 'partner-4',
  //   name: 'XYZ Plumbing',
  //   email: 'leads@xyzplumbing.com',
  //   phone: '555-0200',
  //   categories: ['plumbing'],
  //   serviceArea: {
  //     city: 'Phoenix',
  //     state: 'AZ',
  //     radius: 25,
  //   },
  //   active: true,
  //   viewFee: 15,
  //   acceptFee: 50,
  // },
]

// Find ALL partners for a given service category (for competitive bidding)
export function findPartnersForCategory(category: string): Partner[] {
  return PARTNERS.filter(
    (p) => p.active && p.categories.includes(category.toLowerCase())
  )
}

// Get all active partners
export function getActivePartners(): Partner[] {
  return PARTNERS.filter((p) => p.active)
}

// Get partner by ID
export function getPartnerById(id: string): Partner | null {
  return PARTNERS.find((p) => p.id === id) || null
}
