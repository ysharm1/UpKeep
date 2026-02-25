# Property Type & Tiered Pricing

## Overview

The platform now supports three property types with tiered pricing to maximize revenue from commercial and property manager leads.

## Property Types

### 1. Residential (Single Home)
- **Target**: Individual homeowners
- **View Price**: $15
- **Accept Price**: $50
- **Total Revenue**: $95 per lead (3 views + 1 accept)

### 2. Multi-Family / Property Manager
- **Target**: Property managers, apartment complexes, HOAs
- **View Price**: $25
- **Accept Price**: $100
- **Total Revenue**: $175 per lead (3 views + 1 accept)
- **Why Higher**: Recurring business, larger budgets, multiple properties

### 3. Commercial Building
- **Target**: Office buildings, retail spaces, warehouses
- **View Price**: $35
- **Accept Price**: $150
- **Total Revenue**: $255 per lead (3 views + 1 accept)
- **Why Higher**: Larger jobs, higher urgency, bigger budgets

## Revenue Comparison

| Property Type | View Price | Accept Price | Revenue per Lead |
|--------------|------------|--------------|------------------|
| Residential | $15 | $50 | $95 |
| Multi-Family | $25 | $100 | $175 |
| Commercial | $35 | $150 | $255 |

## Implementation

### Frontend Changes
- Added "Property Type" dropdown to problem submission form
- Options: Residential, Multi-Family/Property Manager, Commercial
- Appears before "Problem Category" field

### Backend Changes
- Added `propertyType` enum to Prisma schema (residential, commercial, multi_family)
- Added `propertyType` field to JobRequest model (defaults to residential)
- Created `lib/pricing.ts` with dynamic pricing configuration
- Updated Stripe functions to use dynamic pricing based on property type
- Updated lead view/accept APIs to pass property type to pricing functions

### Database Migration
- Schema updated with `npx prisma db push`
- Existing leads default to "residential"
- No data loss

## Marketing Strategy

### Target Property Managers
Property managers are the GOLD opportunity:
- Submit 5-20 leads per month (recurring revenue)
- Less price-sensitive than homeowners
- Need vendors in multiple categories
- Will refer other property managers

**One property manager = $500-2000/month in revenue**

### Google Ads Keywords
Add these to your campaigns:
- "property management maintenance"
- "commercial HVAC repair"
- "multi-family plumbing service"
- "apartment building maintenance"
- "commercial property repair"

### Landing Page Copy
Update messaging to appeal to property managers:
- "Fast response for property emergencies"
- "Licensed pros for commercial properties"
- "Manage multiple properties? Get instant quotes"

## Revenue Projections

### Scenario 1: Mixed Customer Base
- 70% Residential: $95 × 70 = $6,650/month
- 20% Multi-Family: $175 × 20 = $3,500/month
- 10% Commercial: $255 × 10 = $2,550/month
- **Total: $12,700/month from 100 leads**

### Scenario 2: Property Manager Focus
- 40% Residential: $95 × 40 = $3,800/month
- 40% Multi-Family: $175 × 40 = $7,000/month
- 20% Commercial: $255 × 20 = $5,100/month
- **Total: $15,900/month from 100 leads**

## Next Steps

1. **Test the Flow**
   - Submit a residential lead
   - Submit a commercial lead
   - Verify pricing is correct in Stripe

2. **Update Marketing**
   - Add property manager keywords to Google Ads
   - Create landing page for commercial customers
   - Update ad copy to mention "residential & commercial"

3. **Track Metrics**
   - Monitor property type distribution
   - Track conversion rates by property type
   - Adjust pricing if needed

## Technical Notes

- Property type is stored in database and passed through entire flow
- Pricing is centralized in `lib/pricing.ts` for easy updates
- Stripe metadata includes property type for tracking
- All existing code remains backward compatible (defaults to residential)
