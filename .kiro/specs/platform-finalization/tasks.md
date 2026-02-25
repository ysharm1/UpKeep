# Platform Finalization - Tasks

## Task 1: Clean Up Deprecated "Accept" Code
- [ ] 1.1 Remove `chargeAcceptFee()` function from `lib/stripe.ts`
- [ ] 1.2 Remove `sendLeadAcceptedNotification()` from `lib/sms.ts`
- [ ] 1.3 Remove `sendLeadAcceptanceConfirmation()` from `lib/sms.ts`
- [ ] 1.4 Delete `app/api/leads/[id]/accept/route.ts` file
- [ ] 1.5 Remove `acceptFee` field from Partner interface in `lib/partners.ts`
- [ ] 1.6 Update all PARTNERS entries to remove acceptFee
- [ ] 1.7 Run TypeScript check to find any remaining references
- [ ] 1.8 Test lead purchase flow still works

## Task 2: Fix SMS Production URLs
- [ ] 2.1 Create `lib/config.ts` with `getAppUrl()` helper function
- [ ] 2.2 Update `lib/sms.ts` to use `getAppUrl()` instead of direct env var
- [ ] 2.3 Add `NEXT_PUBLIC_APP_URL` to `.env.example`
- [ ] 2.4 Verify Vercel environment variables are set
- [ ] 2.5 Test SMS links in production

## Task 3: Add Phone Verification
- [ ] 3.1 Install Twilio Verify SDK: `npm install twilio`
- [ ] 3.2 Create `lib/phone-verification.ts` service
- [ ] 3.3 Add `phoneVerified` field to User model in Prisma schema
- [ ] 3.4 Run database migration
- [ ] 3.5 Create `/api/auth/send-verification-code` endpoint
- [ ] 3.6 Create `/api/auth/verify-phone` endpoint
- [ ] 3.7 Create `app/components/PhoneVerificationModal.tsx` component
- [ ] 3.8 Update registration flow to include verification
- [ ] 3.9 Add verification check before problem submission
- [ ] 3.10 Test verification flow end-to-end

## Task 4: Add Geographic Filtering
- [ ] 4.1 Choose geocoding service (OpenCage recommended)
- [ ] 4.2 Sign up for API key
- [ ] 4.3 Create `lib/geocoding.ts` service
- [ ] 4.4 Add `latitude`, `longitude` to JobRequest model
- [ ] 4.5 Add `serviceRadius`, `latitude`, `longitude` to ServiceProviderProfile model
- [ ] 4.6 Run database migration
- [ ] 4.7 Update job creation to geocode address
- [ ] 4.8 Update `findPartnersForCategory()` to filter by distance
- [ ] 4.9 Update lead marketplace to show distance
- [ ] 4.10 Add service radius setting to provider settings page
- [ ] 4.11 Test with various addresses and distances

## Task 5: Final Testing & Deployment
- [ ] 5.1 Run full test suite
- [ ] 5.2 Test all user flows (homeowner + vendor)
- [ ] 5.3 Deploy to staging
- [ ] 5.4 Smoke test on staging
- [ ] 5.5 Deploy to production
- [ ] 5.6 Monitor error logs
- [ ] 5.7 Send test SMS to verify production URLs
