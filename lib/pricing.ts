// Lead pricing configuration based on property type

export type PropertyType = 'residential' | 'commercial' | 'multi_family'

export interface LeadPricing {
  viewPrice: number // in cents
  acceptPrice: number // in cents
  totalRevenue: number // in cents
}

export const LEAD_PRICING: Record<PropertyType, LeadPricing> = {
  residential: {
    viewPrice: 1500, // $15
    acceptPrice: 5000, // $50
    totalRevenue: 9500, // $95 (3 views + 1 accept)
  },
  commercial: {
    viewPrice: 3500, // $35
    acceptPrice: 15000, // $150
    totalRevenue: 25500, // $255 (3 views + 1 accept)
  },
  multi_family: {
    viewPrice: 2500, // $25
    acceptPrice: 10000, // $100
    totalRevenue: 17500, // $175 (3 views + 1 accept)
  },
}

export function getLeadPricing(propertyType: PropertyType): LeadPricing {
  return LEAD_PRICING[propertyType]
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`
}

export function getPropertyTypeLabel(propertyType: PropertyType): string {
  const labels: Record<PropertyType, string> = {
    residential: 'Residential',
    commercial: 'Commercial',
    multi_family: 'Multi-Family / Property Manager',
  }
  return labels[propertyType]
}
