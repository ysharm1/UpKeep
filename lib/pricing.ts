// Lead pricing configuration based on property type
// Shared lead model: Multiple vendors can purchase the same lead

export type PropertyType = 'residential' | 'commercial' | 'multi_family'

export interface LeadPricing {
  price: number // in cents - single payment for full lead access
}

export const LEAD_PRICING: Record<PropertyType, LeadPricing> = {
  residential: {
    price: 4000, // $40
  },
  multi_family: {
    price: 6000, // $60
  },
  commercial: {
    price: 8000, // $80
  },
}

export function getLeadPricing(propertyType: PropertyType): LeadPricing {
  return LEAD_PRICING[propertyType]
}

export function formatPrice(cents: number): string {
  return `${(cents / 100).toFixed(0)}`
}

export function getPropertyTypeLabel(propertyType: PropertyType): string {
  const labels: Record<PropertyType, string> = {
    residential: 'Residential',
    commercial: 'Commercial',
    multi_family: 'Multi-Family / Property Manager',
  }
  return labels[propertyType]
}
