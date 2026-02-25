# Property Type Pricing - Shared Lead Model

## Overview
We use a **shared lead model** where multiple vendors can purchase the same lead. This maximizes revenue per homeowner submission while keeping prices competitive for vendors.

## Pricing Structure

### 1. Residential (Single Home)
- **Target**: Individual homeowners
- **Price**: $40 per lead
- **Revenue Potential**: $120-200 per lead (3-5 vendors purchase)

### 2. Multi-Family / Property Manager
- **Target**: Apartment complexes, condos, property management companies
- **Price**: $60 per lead (50% premium)
- **Revenue Potential**: $180-300 per lead (3-5 vendors purchase)
- **Why Higher**: Larger properties, recurring business potential, higher budgets

### 3. Commercial
- **Target**: Office buildings, retail spaces, warehouses
- **Price**: $80 per lead (100% premium)
- **Revenue Potential**: $240-400 per lead (3-5 vendors purchase)
- **Why Higher**: Largest jobs, highest urgency, biggest budgets

## Pricing Table

| Property Type | Price per Vendor | Revenue per Lead (3-5 vendors) |
|--------------|------------------|--------------------------------|
| Residential | $40 | $120-200 |
| Multi-Family | $60 | $180-300 |
| Commercial | $80 | $240-400 |

## Implementation

### Database Schema
```prisma
model JobRequest {
  propertyType PropertyType @default(residential)
  // ... other fields
}

enum PropertyType {
  residential
  multi_family
  commercial
}
```

### Pricing Configuration (`lib/pricing.ts`)
```typescript
export const LEAD_PRICING: Record<PropertyType, LeadPricing> = {
  residential: { price: 4000 }, // $40
  multi_family: { price: 6000 }, // $60
  commercial: { price: 8000 }, // $80
}
```

### Stripe Integration
- Single payment to unlock full lead details
- Multiple vendors can purchase the same lead
- No refunds, no chargebacks

## Revenue Projections

### Conservative (3 vendors per lead)
- 100 residential leads/month: $40 × 3 × 100 = $12,000/month
- 40 multi-family leads/month: $60 × 3 × 40 = $7,200/month
- 20 commercial leads/month: $80 × 3 × 20 = $4,800/month
- **Total: $24,000/month from 160 leads**

### Optimistic (5 vendors per lead)
- 100 residential leads/month: $40 × 5 × 100 = $20,000/month
- 40 multi-family leads/month: $60 × 5 × 40 = $12,000/month
- 20 commercial leads/month: $80 × 5 × 20 = $8,000/month
- **Total: $40,000/month from 160 leads**

## Competitive Analysis

**HomeAdvisor**: $15-80 per lead (shared)
**Thumbtack**: $15-65 per lead (shared)
**Angi**: $20-60 per lead (shared)

Our pricing is competitive and in line with industry standards.

## Next Steps

1. ✅ Update pricing in `lib/pricing.ts`
2. ✅ Update Stripe integration to use single payment
3. ✅ Update all UI to reflect new pricing
4. ✅ Remove "accept" functionality (no longer needed)
5. ✅ Update documentation
