# Platform Finalization - Tasks

## Task 1: Clean Up Deprecated "Accept" Code
- [x] 1.1 Remove `chargeAcceptFee()` function from `lib/stripe.ts`
- [x] 1.2 Remove `sendLeadAcceptedNotification()` from `lib/sms.ts`
- [x] 1.3 Remove `sendLeadAcceptanceConfirmation()` from `lib/sms.ts`
- [x] 1.4 Delete `app/api/leads/[id]/accept/route.ts` file
- [x] 1.5 Remove `acceptFee` field from Partner interface in `lib/partners.ts`
- [x] 1.6 Update all PARTNERS entries to remove acceptFee
- [x] 1.7 Run TypeScript check to find any remaining references
- [x] 1.8 Test lead purchase flow still works

## Task 2: Fix SMS Production URLs
- [x] 2.1 Create `lib/config.ts` with `getAppUrl()` helper function
- [x] 2.2 Update `lib/sms.ts` to use `getAppUrl()` instead of direct env var
- [x] 2.3 Add `NEXT_PUBLIC_APP_URL` to `.env.example`
- [x] 2.4 Verify Vercel environment variables are set
- [x] 2.5 Test SMS links in production

## Task 3: Add Phone Verification
- [x] 3.1 Install Twilio Verify SDK: `npm install twilio`
- [x] 3.2 Create `lib/phone-verification.ts` service
- [x] 3.3 Add `phoneVerified` field to User model in Prisma schema
- [x] 3.4 Run database migration
- [x] 3.5 Create `/api/auth/send-verification-code` endpoint
- [x] 3.6 Create `/api/auth/verify-phone` endpoint
- [x] 3.7 Create `app/components/PhoneVerificationModal.tsx` component
- [x] 3.8 Update registration flow to include verification
- [x] 3.9 Add verification check before problem submission
- [x] 3.10 Test verification flow end-to-end

## Task 4: Add Geographic Filtering
- [x] 4.1 Choose geocoding service (OpenCage recommended)
- [x] 4.2 Sign up for API key
- [x] 4.3 Create `lib/geocoding.ts` service
- [x] 4.4 Add `latitude`, `longitude` to JobRequest model
- [x] 4.5 Add `serviceRadius`, `latitude`, `longitude` to ServiceProviderProfile model
- [x] 4.6 Run database migration
- [x] 4.7 Update job creation to geocode address
- [x] 4.8 Update `findPartnersForCategory()` to filter by distance
- [x] 4.9 Update lead marketplace to show distance
- [x] 4.10 Add service radius setting to provider settings page
- [x] 4.11 Test with various addresses and distances

## Task 5: Final Testing & Deployment
- [x] 5.1 Run full test suite
- [x] 5.2 Test all user flows (homeowner + vendor)
- [x] 5.3 Deploy to staging
- [x] 5.4 Smoke test on staging
- [x] 5.5 Deploy to production
- [x] 5.6 Monitor error logs
- [x] 5.7 Send test SMS to verify production URLs
