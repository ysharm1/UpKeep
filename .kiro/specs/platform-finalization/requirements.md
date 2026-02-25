# Platform Finalization - Requirements

## Overview
Finalize the lead generation platform by fixing critical bugs and removing deprecated code before launch.

## User Stories

### 1. Clean Up Deprecated "Accept" Code
**As a developer**, I want to remove all deprecated "accept" functionality so the codebase only has one payment model (shared leads).

**Acceptance Criteria:**
- 1.1 Remove `chargeAcceptFee()` function from `lib/stripe.ts`
- 1.2 Remove `/api/leads/[id]/accept/route.ts` endpoint
- 1.3 Remove `LeadAcceptance` references from database queries
- 1.4 Remove "accept" related SMS functions
- 1.5 Update `lib/partners.ts` to remove `acceptFee` field
- 1.6 Clean up any UI references to "accepting" leads

### 2. Add Geographic Filtering for Vendor Notifications
**As a vendor**, I only want to receive SMS notifications for leads within my service area so I don't waste time on jobs I can't service.

**Acceptance Criteria:**
- 2.1 Add geocoding service to convert addresses to lat/lng coordinates
- 2.2 Update `findPartnersForCategory()` to accept location parameter
- 2.3 Filter partners by distance from job location (within their service radius)
- 2.4 Only send SMS to vendors within service area
- 2.5 Show distance on lead cards in vendor marketplace

### 3. Fix SMS Production URLs
**As a vendor**, I want SMS links to work in production so I can click through to view leads.

**Acceptance Criteria:**
- 3.1 Ensure `NEXT_PUBLIC_APP_URL` is set in production environment
- 3.2 Update SMS templates to use production URL
- 3.3 Test SMS links in production environment
- 3.4 Add fallback URL if env var is missing

### 4. Add Phone Verification for Homeowners
**As a platform owner**, I want to verify homeowner phone numbers so we reduce spam and improve lead quality.

**Acceptance Criteria:**
- 4.1 Add phone verification step during registration
- 4.2 Send verification code via SMS
- 4.3 Require verification before submitting first problem
- 4.4 Store verification status in database
- 4.5 Add UI for entering verification code
- 4.6 Handle verification errors gracefully

## Technical Notes

### Geographic Filtering
- Use a geocoding service (Google Maps API, Mapbox, or OpenCage)
- Calculate distance using Haversine formula
- Store lat/lng on JobRequest for performance

### Phone Verification
- Use Twilio Verify API (simpler than manual SMS codes)
- Add `phoneVerified` boolean to User model
- Block problem submission if not verified

## Out of Scope
- Vendor onboarding flow (separate feature)
- Lead quality rating system (post-launch)
- ROI tracking dashboard (post-launch)
