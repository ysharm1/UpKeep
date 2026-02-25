# Platform Finalization - Design

## 1. Clean Up Deprecated "Accept" Code

### Files to Modify
- `lib/stripe.ts` - Remove `chargeAcceptFee()`
- `app/api/leads/[id]/accept/route.ts` - Delete entire file
- `lib/sms.ts` - Remove accept-related SMS functions
- `lib/partners.ts` - Remove `acceptFee` field from Partner interface
- Database queries - Remove LeadAcceptance references

### Implementation
1. Delete deprecated functions
2. Remove API routes
3. Clean up database queries
4. Update TypeScript types

---

## 2. Add Geographic Filtering

### Architecture

```typescript
// lib/geocoding.ts
interface Coordinates {
  latitude: number
  longitude: number
}

async function geocodeAddress(address: string): Promise<Coordinates>
function calculateDistance(coord1: Coordinates, coord2: Coordinates): number
```

### Geocoding Service Options

**Option A: OpenCage (Recommended)**
- Free tier: 2,500 requests/day
- Simple API
- No credit card required
- Good for MVP

**Option B: Google Maps**
- More accurate
- Requires billing account
- $5 per 1000 requests

**Option C: Mapbox**
- Free tier: 100,000 requests/month
- Good documentation

### Implementation Flow

1. **Job Creation**
   - Geocode homeowner address
   - Store lat/lng on JobRequest

2. **Partner Notification**
   - Get all partners for category
   - Calculate distance from job to each partner
   - Filter partners within service radius
   - Send SMS only to nearby partners

3. **Lead Marketplace**
   - Show distance on lead cards
   - Sort by distance (closest first)

### Database Changes

```prisma
model JobRequest {
  // ... existing fields
  latitude  Float?
  longitude Float?
}

model ServiceProviderProfile {
  // ... existing fields
  serviceRadius Int @default(25) // miles
  latitude      Float?
  longitude     Float?
}
```

---

## 3. Fix SMS Production URLs

### Current Issue
```typescript
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
```

In production, this might default to localhost if env var not set.

### Solution

```typescript
function getAppUrl(): string {
  // Priority order:
  // 1. Explicit env var
  // 2. Vercel URL
  // 3. Fallback to localhost (dev only)
  
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  return 'http://localhost:3000'
}
```

### Environment Variables

**Production (.env.production)**
```
NEXT_PUBLIC_APP_URL=https://upkeep.yourdomain.com
```

**Vercel Dashboard**
- Add `NEXT_PUBLIC_APP_URL` to environment variables
- Set for Production, Preview, and Development

---

## 4. Add Phone Verification

### User Flow

1. **Registration**
   - User enters phone number
   - System sends 6-digit code via SMS
   - User enters code
   - System verifies and marks phone as verified

2. **Problem Submission**
   - Check if phone verified
   - If not, show verification modal
   - Block submission until verified

### Implementation

**Option A: Twilio Verify API (Recommended)**
```typescript
// lib/phone-verification.ts
async function sendVerificationCode(phoneNumber: string): Promise<string>
async function checkVerificationCode(phoneNumber: string, code: string): Promise<boolean>
```

**Option B: Manual SMS Codes**
- Generate random 6-digit code
- Store in database with expiry (5 minutes)
- Send via Twilio
- Verify on submission

### Database Changes

```prisma
model User {
  // ... existing fields
  phoneVerified        Boolean   @default(false)
  phoneVerificationCode String?
  phoneVerificationExpiry DateTime?
}
```

### UI Components

**VerificationModal.tsx**
- Shows when user tries to submit problem without verification
- Input for 6-digit code
- "Resend Code" button
- Error handling

**RegistrationFlow**
- Add verification step after phone number entry
- Show success message when verified

---

## Implementation Order

1. **Task 1: Clean up accept code** (30 min)
   - Low risk, high value
   - Simplifies codebase

2. **Task 3: Fix SMS URLs** (15 min)
   - Critical for production
   - Easy fix

3. **Task 4: Phone verification** (2 hours)
   - Improves lead quality
   - Reduces spam

4. **Task 2: Geographic filtering** (3 hours)
   - Most complex
   - Highest value for vendors
   - Requires geocoding service setup

---

## Testing Plan

### Task 1: Accept Code Cleanup
- Verify no TypeScript errors
- Check all API routes still work
- Test lead purchase flow

### Task 2: Geographic Filtering
- Test with various addresses
- Verify distance calculations
- Check edge cases (Alaska, Hawaii)

### Task 3: SMS URLs
- Send test SMS in production
- Click links and verify they work
- Test on mobile devices

### Task 4: Phone Verification
- Test verification flow
- Test code expiry
- Test resend functionality
- Test error cases (wrong code, expired code)

---

## Rollout Strategy

1. Deploy to staging
2. Test all 4 features
3. Deploy to production
4. Monitor error logs
5. Test with real vendors

---

## Risks & Mitigations

**Risk: Geocoding API costs**
- Mitigation: Use free tier (OpenCage), cache results

**Risk: Phone verification blocks legitimate users**
- Mitigation: Clear error messages, easy resend

**Risk: Geographic filtering too restrictive**
- Mitigation: Make service radius configurable per vendor

**Risk: Breaking existing functionality**
- Mitigation: Thorough testing, gradual rollout
