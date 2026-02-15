# Instant Booking Backend - Implementation Tasks

## Overview
Complete the backend implementation for instant booking flow. All UI is built - we're wiring up the API endpoints and payment logic.

---

## Tasks

- [x] 1. Database schema updates
  - Update Prisma schema with new fields and models
  - Add provider reliability tracking fields (responseTimeAvg, cancellationRate, completionRate, reliabilityScore, isActive)
  - Run migration
  - Generate Prisma client
  - _Requirements: All (foundational)_
  - _Estimated time: 35 minutes (added 5 min for reliability fields)_

- [x] 2. Diagnostic fee management
  - [x] 2.1 Create diagnostic fee endpoint
    - Create `app/api/providers/[id]/diagnostic-fee/route.ts`
    - Implement PUT handler with authentication
    - Validate fee is between $50-$150
    - Update ServiceProviderProfile in database
    - Return updated profile
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [x] 2.2 Wire up provider settings UI
    - Update `app/provider/settings/page.tsx`
    - Add API call to save diagnostic fee
    - Add loading state and error handling
    - _Requirements: 1.3_
  
  - _Estimated time: 1 hour_

- [x] 3. Provider nearby search
  - [x] 3.1 Create nearby providers endpoint
    - Create `app/api/providers/nearby/route.ts`
    - Implement GET handler
    - Query providers with matching specialty
    - Calculate distance from job location
    - Filter by service area
    - Sort by distance, return top 5
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 3.2 Wire up professionals page
    - Update `app/problems/[id]/professionals/page.tsx`
    - Call nearby providers API
    - Display real provider data
    - _Requirements: 3.3_
  
  - _Estimated time: 1 hour_

- [x] 4. Instant booking implementation
  - [x] 4.1 Create booking endpoint
    - Create `app/api/bookings/route.ts`
    - Implement POST handler with authentication
    - Get provider's diagnostic fee
    - Create Stripe PaymentIntent with capture_method: 'manual'
    - Store paymentIntentId in JobRequest
    - Update job status to 'diagnostic_scheduled'
    - Return booking confirmation
    - _Requirements: 2.1, 2.2, 2.3, 2.5_
  
  - [x] 4.2 Wire up booking button
    - Update `app/problems/[id]/professionals/page.tsx`
    - Connect "Book Diagnostic Visit" button to API
    - Add loading state and error handling
    - Show success message
    - _Requirements: 2.1_
  
  - [x] 4.3 Test booking flow
    - Book diagnostic visit
    - Verify payment authorized in Stripe dashboard
    - Verify job status updated
    - Verify payment NOT captured yet
    - _Requirements: 2.2, 2.3_
  
  - _Estimated time: 2 hours_

- [x] 5. Repair quote submission
  - [x] 5.1 Create repair quote endpoint
    - Create `app/api/jobs/[id]/repair-quote/route.ts`
    - Implement POST handler with authentication
    - Validate provider is assigned to job
    - Validate labor and parts costs
    - Calculate total amount
    - Create RepairQuote with status PENDING
    - Update job status to 'repair_pending_approval'
    - Return created quote
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 5.2 Create get repair quote endpoint
    - Implement GET handler in same file
    - Validate user is homeowner or assigned provider
    - Return RepairQuote or null
    - _Requirements: 5.1_
  
  - [x] 5.3 Wire up repair quote form
    - Update `app/provider/jobs/[id]/repair-quote/page.tsx`
    - Connect form submission to API
    - Add loading state and error handling
    - Show success message
    - _Requirements: 4.1_
  
  - [x] 5.4 Test repair quote flow
    - Submit repair quote as provider
    - Verify quote saved to database
    - Verify job status updated
    - _Requirements: 4.3, 4.4_
  
  - _Estimated time: 1.5 hours_

- [x] 6. Repair quote approval
  - [x] 6.1 Create approve repair endpoint
    - Create `app/api/jobs/[id]/approve-repair/route.ts`
    - Implement POST handler with authentication
    - Validate homeowner owns job
    - Get RepairQuote for job
    - Create Stripe PaymentIntent for repair amount
    - Store repairPaymentIntentId in JobRequest
    - Update RepairQuote status to APPROVED
    - Update job status to 'repair_approved'
    - Return approval confirmation
    - _Requirements: 5.2, 5.3, 5.4, 5.5_
  
  - [x] 6.2 Create repair approval page
    - Create `app/jobs/[id]/approve-repair/page.tsx`
    - Display repair quote details
    - Show diagnostic + repair total
    - Add "Approve" and "Decline" buttons
    - Wire up approve button to API
    - Add loading state and error handling
    - _Requirements: 5.1, 5.2_
  
  - [x] 6.3 Test repair approval flow
    - Approve repair quote as homeowner
    - Verify second payment authorized in Stripe
    - Verify quote status updated
    - Verify job status updated
    - _Requirements: 5.3, 5.4, 5.5_
  
  - _Estimated time: 2 hours_

- [x] 7. Capture diagnostic payment (after visit)
  - [x] 7.1 Create capture diagnostic endpoint
    - Create `app/api/jobs/[id]/capture-diagnostic/route.ts`
    - Implement POST handler with authentication
    - Validate provider is assigned to job
    - Get diagnostic payment intent ID
    - Capture diagnostic payment
    - Update job status to 'diagnostic_completed'
    - Return capture confirmation
    - _Requirements: 6.1, 6.2_
  
  - [x] 7.2 Wire up capture button
    - Add "Capture Diagnostic Payment" button to provider dashboard
    - Connect to capture API
    - Add loading state and error handling
    - Show success message
    - _Requirements: 6.1_
  
  - [x] 7.3 Test diagnostic capture
    - Capture diagnostic payment as provider
    - Verify payment captured in Stripe
    - Verify job status updated
    - _Requirements: 6.2_
  
  - _Estimated time: 1 hour_

- [x] 8. Job completion and repair payment capture
  - [x] 8.1 Create job completion endpoint
    - Create `app/api/jobs/[id]/complete/route.ts`
    - Implement POST handler with authentication
    - Validate provider is assigned to job
    - Get repair payment intent ID
    - Capture repair payment intent
    - Calculate total, platform fee (15%), provider payout (85%)
    - Create Payment record
    - Update job status to 'completed'
    - Return completion confirmation
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [x] 8.2 Wire up complete button
    - Update provider dashboard or job detail page
    - Add "Mark Complete" button
    - Connect to completion API
    - Add loading state and error handling
    - Show success message with payment details
    - _Requirements: 6.1_
  
  - [x] 8.3 Test completion flow
    - Mark job complete as provider
    - Verify repair payment captured in Stripe
    - Verify Payment record created
    - Verify amounts calculated correctly (15% fee)
    - Verify job status updated
    - _Requirements: 6.2, 6.3, 6.4, 6.5_
  
  - _Estimated time: 1.5 hours_

- [x] 9. Error handling and validation
  - [x] 9.1 Add error handling to all endpoints
    - Wrap all API logic in try-catch blocks
    - Handle Stripe errors specifically
    - Return appropriate HTTP status codes
    - Return user-friendly error messages
    - Log error details for debugging
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [x] 9.2 Add input validation
    - Validate diagnostic fee range ($50-$150)
    - Validate repair costs are positive
    - Validate required fields are present
    - Return 400 with validation errors
    - _Requirements: 7.3_
  
  - [x] 9.3 Test error scenarios
    - Test with invalid inputs
    - Test with unauthorized users
    - Test with non-existent resources
    - Test Stripe errors (use test cards)
    - Verify error messages are clear
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - _Estimated time: 1 hour_

- [x] 9. Loading states and UI polish
  - [x] 9.1 Add loading states to all buttons
    - Add loading spinner to booking button
    - Add loading spinner to quote submission button
    - Add loading spinner to approve button
    - Add loading spinner to complete button
    - Disable buttons during loading
    - _Requirements: 8.1, 8.2_
  
  - [x] 9.2 Add success/error messages
    - Show success toast after booking
    - Show success toast after quote submission
    - Show success toast after approval
    - Show success toast after completion
    - Show error toast on failures
    - _Requirements: 8.3, 8.4_
  
  - [x] 9.3 Test loading states
    - Verify spinners appear during API calls
    - Verify buttons are disabled during loading
    - Verify success/error messages appear
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - _Estimated time: 1 hour_

- [-] 10. Admin override tools (CRITICAL FOR BETA)
  - [x] 10.1 Create admin page
    - Create `app/admin/page.tsx`
    - Add daily operations dashboard:
      * New bookings (need provider assignment)
      * Pending responses (>4 hours old)
      * Failed payments (need retry)
      * Pending quotes (need homeowner approval)
      * Completed jobs (need payout)
    - List all jobs with filters
    - Show job status and payment status
    - Show provider reliability metrics (response time, cancellation rate, completion rate)
    - Add authentication check (admin role)
  
  - [x] 10.2 Create admin job status endpoint
    - Create `app/api/admin/jobs/[id]/status/route.ts`
    - Allow manual status changes
    - Log all admin actions
    - Require admin authentication
  
  - [x] 10.3 Create admin payment endpoints
    - Create `app/api/admin/jobs/[id]/capture/route.ts` - Force capture
    - Create `app/api/admin/jobs/[id]/refund/route.ts` - Issue refund
    - Create `app/api/admin/jobs/[id]/complete/route.ts` - Force complete
    - Log all admin actions
  
  - [x] 10.4 Create admin provider management endpoints
    - Create `app/api/admin/providers/[id]/reassign/route.ts` - Reassign job
    - Create `app/api/admin/providers/[id]/toggle-active/route.ts` - Activate/deactivate provider
    - Create `app/api/admin/payments/[id]/retry/route.ts` - Retry failed payment
  
  - [x] 10.5 Wire up admin UI
    - Add "Change Status" dropdown
    - Add "Force Capture" button
    - Add "Issue Refund" button
    - Add "Force Complete" button
    - Add "Reassign Job" button
    - Add "Retry Payment" button
    - Add "Toggle Provider Active" button
    - Add confirmation dialogs
    - Show provider contact info (phone/email)
    - Show homeowner contact info
  
  - _Estimated time: 3 hours (added 1 hour for operations dashboard)_
  - _Note: You WILL need this during beta_

- [ ] 11. Mobile responsive testing
  - [ ] 10.1 Test on iPhone Safari
    - Test problem submission flow
    - Test booking flow
    - Test provider dashboard
    - Test repair quote submission
    - Fix any layout issues
  
  - [ ] 11.2 Test on Android Chrome
    - Test problem submission flow
    - Test booking flow
    - Test provider dashboard
    - Test repair quote submission
    - Fix any layout issues
  
  - [ ] 11.3 Ensure touch-friendly interactions
    - Verify buttons are large enough (44x44px minimum)
    - Verify form inputs are easy to tap
    - Verify spacing is adequate
    - Fix any touch issues
  
  - _Estimated time: 2 hours_

- [ ] 12. End-to-end testing
  - [ ] 12.1 Test complete homeowner flow
    - Register as homeowner
    - Submit problem with photo
    - Chat with AI
    - View nearby providers
    - Book diagnostic visit
    - Verify payment authorized
    - Receive repair quote notification
    - Approve repair quote
    - Verify second payment authorized
    - Receive completion notification
    - Verify both payments captured
  
  - [ ] 12.2 Test complete provider flow
    - Register as provider
    - Set diagnostic fee
    - Receive booking notification
    - View booking details
    - Submit repair quote
    - Receive approval notification
    - Mark job complete
    - Verify payment received (85%)
  
  - [ ] 12.3 Test edge cases
    - Test with no diagnostic fee set
    - Test with declined repair quote
    - Test with cancelled job
    - Test with multiple providers
    - Test with Stripe test cards (declined, etc.)
  
  - _Estimated time: 2 hours_

- [ ] 13. Production deployment
  - [ ] 13.1 Set up production environment
    - Create production database (Railway/Supabase)
    - Set up production Stripe account
    - Configure production environment variables
    - Set up custom domain
  
  - [ ] 13.2 Deploy to Vercel
    - Connect GitHub repo to Vercel
    - Add environment variables
    - Deploy to production
    - Verify deployment successful
  
  - [ ] 13.3 Run production migrations
    - Run Prisma migrations on production database
    - Seed initial data if needed
    - Test database connection
  
  - [ ] 13.4 Test production deployment
    - Test complete flow on production
    - Verify Stripe integration works
    - Verify payments are processed correctly
    - Monitor error logs
  
  - _Estimated time: 4 hours_

---

## Summary

**Total Estimated Time: 15-17 hours (2 days of focused work)**

**Critical Path (MUST Complete):**
1. Database schema (35 min) ← includes reliability tracking
2. Diagnostic fee management (1 hour)
3. Provider nearby search (1 hour)
4. Instant booking (1.5 hours)
5. Capture diagnostic (45 min)
6. Repair quote submission (1 hour)
7. Repair quote approval (1 hour)
8. Job completion (1 hour)
9. Admin tools (3 hours) ← **CRITICAL FOR BETA** (includes operations dashboard)

**Polish (Should Complete):**
10. Error handling (1 hour)
11. Loading states (1 hour)
12. Mobile testing (2 hours)

**Testing (MUST Complete):**
13. End-to-end testing (2 hours)

**Deployment (MUST Complete):**
14. Production deployment (4 hours)

**Post-Launch (Week 1):**
- Copy changes for killer promise (2 hours)
- Provider onboarding calls (3-4 hours/day)
- Manual operations management (use admin dashboard)

---

## Testing Checklist

### Unit Tests (Optional for MVP)
- [ ] Test diagnostic fee validation
- [ ] Test nearby provider search logic
- [ ] Test payment calculation (15% fee)
- [ ] Test status transitions

### Integration Tests (Required)
- [ ] Test complete booking flow
- [ ] Test complete repair quote flow
- [ ] Test payment capture flow
- [ ] Test error handling

### Manual Testing (Required)
- [ ] Test on desktop browser
- [ ] Test on iPhone Safari
- [ ] Test on Android Chrome
- [ ] Test with Stripe test cards
- [ ] Test all error scenarios

---

## Notes

- **PAYMENT FLOW CHANGE:** Capture diagnostic AFTER visit, not at completion
- Use Stripe test mode for all development
- Test cards: 4242 4242 4242 4242 (success), 4000 0000 0000 0002 (declined)
- Always calculate 15% platform fee
- Store all payment intent IDs for audit trail
- Log all payment operations for debugging
- **Admin tools are CRITICAL** - you will need them during beta
- Focus on happy path first, then failure handling
- Don't expand scope - ship when happy path works
