# Implementation Plan: Quote and Payment System

## Overview

This implementation plan breaks down the quote and payment system into discrete coding tasks. The approach follows an incremental strategy: database schema → core services → API routes → UI components → integration. Each task builds on previous work and includes testing sub-tasks to validate functionality early.

## Tasks

- [ ] 1. Set up database schema and migrations
  - Create Prisma schema extensions for Quote model with all fields (id, jobRequestId, providerId, cost breakdown, totalAmount, notes, status, timestamps)
  - Add QuoteStatus enum (PENDING, ACCEPTED, REJECTED)
  - Add JobStatus enum (OPEN, QUOTED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED)
  - Add PaymentStatus enum (PENDING, AUTHORIZED, CAPTURED, REFUNDED, FAILED)
  - Extend ServiceProviderProfile with optional base rate fields (hourlyRate, diagnosticFee, emergencyRate, serviceCallFee)
  - Extend JobRequest with quotes relation, acceptedQuoteId, status, and completedAt fields
  - Extend Payment model with jobRequestId, quoteId, stripePaymentIntentId, amount, platformFee, providerPayout, and status fields
  - Create and run Prisma migration
  - _Requirements: 1.1, 3.6, 14.1, 14.2_

- [ ] 2. Implement Quote Service core functionality
  - [ ] 2.1 Create QuoteService class with validation methods
    - Implement validateQuoteTotals to verify total equals sum of components
    - Implement validation for non-negative monetary values
    - Implement validation for required fields (laborCost, partsEstimate, totalAmount)
    - _Requirements: 3.2, 3.4, 3.5_
  
  - [ ] 2.2 Write property test for quote validation
    - **Property 3: Quote total equals sum of components**
    - **Validates: Requirements 3.4**
  
  - [ ] 2.3 Write property test for monetary value validation
    - **Property 2: Quote monetary value non-negativity**
    - **Validates: Requirements 3.5**
  
  - [ ] 2.4 Implement createQuote method
    - Validate input using validateQuoteTotals and field validators
    - Check that provider hasn't already quoted on this job
    - Store quote in database with all fields and associations
    - Return created quote with timestamp
    - _Requirements: 3.4, 3.5, 3.6_
  
  - [ ] 2.5 Write property test for quote persistence
    - **Property 8: Quote persistence round-trip**
    - **Validates: Requirements 3.6, 14.1**
  
  - [ ] 2.6 Write property test for multiple quotes per job
    - **Property 10: Multiple quotes per job**
    - **Validates: Requirements 3.7**

- [ ] 3. Implement Quote Service retrieval and acceptance
  - [ ] 3.1 Implement getQuotesByJobRequest method
    - Fetch all quotes for a job request with provider details
    - Include provider name, rating, and location
    - Sort by submission date descending
    - Calculate distance between provider and job location
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ] 3.2 Write property test for quote list completeness
    - **Property 13: Quote list completeness**
    - **Validates: Requirements 4.1**
  
  - [ ] 3.3 Write property test for quote sorting
    - **Property 14: Quote sorting by date**
    - **Validates: Requirements 4.3**
  
  - [ ] 3.4 Implement acceptQuote method
    - Verify quote exists and belongs to the job
    - Verify user is the job owner
    - Mark selected quote as ACCEPTED
    - Mark all other quotes for that job as REJECTED
    - Update job status to ACCEPTED
    - Return accepted quote
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ] 3.5 Write property test for quote acceptance exclusivity
    - **Property 11: Quote acceptance exclusivity**
    - **Validates: Requirements 5.1, 5.2**
  
  - [ ] 3.6 Write property test for single acceptance per job
    - **Property 12: Single acceptance per job**
    - **Validates: Requirements 5.3**

- [ ] 4. Implement Payment Service extensions
  - [ ] 4.1 Implement calculateFees method
    - Calculate platform fee as amount * 0.15
    - Calculate provider payout as amount * 0.85
    - Return both values with proper decimal precision
    - _Requirements: 6.5, 6.6_
  
  - [ ] 4.2 Write property test for fee calculation
    - **Property 20: Platform fee calculation**
    - **Validates: Requirements 6.5, 6.6**
  
  - [ ] 4.3 Implement authorizePayment method
    - Calculate fees using calculateFees
    - Create Stripe payment intent with capture_method: 'manual'
    - Store payment intent ID in Payment model
    - Set payment status to AUTHORIZED
    - Associate payment with job and quote
    - Return payment record
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6_
  
  - [ ] 4.4 Write property test for payment authorization
    - **Property 17: Payment authorization on quote acceptance**
    - **Validates: Requirements 5.5, 6.1, 6.2**
  
  - [ ] 4.5 Write unit test for payment authorization failure handling
    - Test Stripe API failure scenario
    - Verify error is logged and returned
    - _Requirements: 6.4_
  
  - [ ] 4.6 Implement capturePayment method
    - Verify payment exists and status is AUTHORIZED
    - Call Stripe payment intent capture API
    - Update payment status to CAPTURED
    - Update job status to COMPLETED
    - Return updated payment record
    - _Requirements: 7.1, 7.2, 7.5_
  
  - [ ] 4.7 Write property test for payment capture
    - **Property 21: Payment capture on job completion**
    - **Validates: Requirements 7.1, 7.5**
  
  - [ ] 4.8 Implement cancelPayment method
    - Verify payment exists
    - If status is AUTHORIZED: cancel Stripe payment intent
    - If status is CAPTURED: issue Stripe refund
    - Update payment status to REFUNDED
    - Update job status to CANCELLED
    - Return updated payment record
    - _Requirements: 8.1, 8.2, 8.5_
  
  - [ ] 4.9 Write property test for payment cancellation
    - **Property 22: Payment cancellation before completion**
    - **Validates: Requirements 8.1, 8.5**

- [ ] 5. Checkpoint - Ensure core services work correctly
  - Run all tests to verify quote and payment services
  - Ensure all property tests pass with 100+ iterations
  - Ask the user if questions arise

- [ ] 6. Implement Provider Service extensions
  - [ ] 6.1 Implement updateBaseRates method
    - Validate all provided rates are non-negative
    - Update provider profile with new rates (allow null values)
    - Return updated profile
    - _Requirements: 1.2, 1.3, 1.4_
  
  - [ ] 6.2 Write property test for base rate validation
    - **Property 1: Base rate non-negativity**
    - **Validates: Requirements 1.2**
  
  - [ ] 6.3 Write property test for base rate persistence
    - **Property 6: Base rate round-trip**
    - **Validates: Requirements 1.3**
  
  - [ ] 6.4 Implement getAvailableJobs method
    - Fetch jobs matching provider's service categories
    - Exclude jobs where provider already submitted a quote
    - Exclude jobs with accepted quotes
    - Include job description, location, distance, posted date
    - Sort by posted date descending
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [ ] 6.5 Write property test for available jobs filtering
    - **Property 30: Available jobs filtering**
    - **Validates: Requirements 9.1, 9.3, 9.4**
  
  - [ ] 6.6 Implement getActiveJobs method
    - Fetch jobs where provider's quote was accepted
    - Include job details, payment status, homeowner contact info
    - Sort by acceptance date descending
    - _Requirements: 11.1, 11.2_
  
  - [ ] 6.7 Write property test for active jobs filtering
    - **Property 33: Provider active jobs filtering**
    - **Validates: Requirements 11.1**

- [ ] 7. Implement Notification Service integration
  - [ ] 7.1 Create notification helper methods
    - Implement notifyHomeownerQuoteSubmitted
    - Implement notifyProviderQuoteAccepted
    - Implement notifyProviderQuoteRejected
    - Implement notifyHomeownerPaymentFailed
    - Implement notifyBothPartiesJobCompleted
    - Implement notifyBothPartiesPaymentCaptureFailed
    - Implement notifyBothPartiesJobCancelled
    - _Requirements: 3.8, 5.4, 15.1, 15.2, 15.3, 15.4, 7.6, 7.4, 8.3_
  
  - [ ] 7.2 Write property tests for notification creation
    - **Property 40: Quote submission notification**
    - **Property 41: Quote acceptance notification**
    - **Property 42: Quote rejection notification**
    - **Property 44: Job completion notification**
    - **Validates: Requirements 3.8, 5.4, 15.3, 7.6**
  
  - [ ] 7.3 Integrate notifications into Quote Service
    - Call notifyHomeownerQuoteSubmitted in createQuote
    - Call notifyProviderQuoteAccepted and notifyProviderQuoteRejected in acceptQuote
    - _Requirements: 3.8, 5.4, 15.1, 15.2, 15.3_
  
  - [ ] 7.4 Integrate notifications into Payment Service
    - Call notifyHomeownerPaymentFailed in authorizePayment on failure
    - Call notifyBothPartiesJobCompleted in capturePayment on success
    - Call notifyBothPartiesPaymentCaptureFailed in capturePayment on failure
    - Call notifyBothPartiesJobCancelled in cancelPayment
    - _Requirements: 15.4, 7.6, 7.4, 8.3_

- [ ] 8. Implement API routes for quotes
  - [ ] 8.1 Create POST /api/quotes route
    - Extract quote input from request body
    - Validate user is authenticated provider
    - Call QuoteService.createQuote
    - Return 201 with created quote or appropriate error status
    - _Requirements: 3.2, 3.4, 3.5, 3.6_
  
  - [ ] 8.2 Create GET /api/quotes route with jobRequestId query param
    - Extract jobRequestId from query
    - Call QuoteService.getQuotesByJobRequest
    - Return 200 with quote list
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ] 8.3 Create POST /api/quotes/[id]/accept route
    - Extract quote ID from params
    - Validate user is authenticated homeowner
    - Use Prisma transaction to:
      - Call QuoteService.acceptQuote
      - Call PaymentService.authorizePayment
    - On payment failure: rollback quote acceptance
    - Return 200 with quote and payment or appropriate error status
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 6.1, 6.2, 6.3, 6.4_
  
  - [ ] 8.4 Create GET /api/quotes/provider/[providerId] route
    - Extract providerId from params
    - Validate user is authenticated and matches providerId
    - Call QuoteService.getQuotesByProvider
    - Support status filter query param
    - Return 200 with quote list
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ] 8.5 Write integration tests for quote API routes
    - Test full quote submission flow
    - Test quote acceptance with payment authorization
    - Test error cases (validation failures, unauthorized access)
    - _Requirements: 3.6, 5.5, 6.1_

- [ ] 9. Implement API routes for providers and jobs
  - [ ] 9.1 Create PUT /api/providers/[id]/base-rates route
    - Extract providerId from params and rates from body
    - Validate user is authenticated and matches providerId
    - Call ProviderService.updateBaseRates
    - Return 200 with updated profile or appropriate error status
    - _Requirements: 1.2, 1.3, 1.4_
  
  - [ ] 9.2 Create GET /api/providers/[id]/available-jobs route
    - Extract providerId from params
    - Validate user is authenticated and matches providerId
    - Call ProviderService.getAvailableJobs
    - Return 200 with job list
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [ ] 9.3 Create POST /api/jobs/[id]/complete route
    - Extract job ID from params
    - Validate user is authenticated provider with accepted quote for this job
    - Call PaymentService.capturePayment
    - Return 200 with job and payment or appropriate error status
    - _Requirements: 7.1, 7.2, 7.5, 7.6_
  
  - [ ] 9.4 Create POST /api/jobs/[id]/cancel route
    - Extract job ID from params
    - Validate user is authenticated (homeowner or provider for this job)
    - Call PaymentService.cancelPayment
    - Return 200 with job and payment or appropriate error status
    - _Requirements: 8.1, 8.2, 8.4, 8.5_
  
  - [ ] 9.5 Write integration tests for provider and job API routes
    - Test base rate updates
    - Test job completion with payment capture
    - Test job cancellation with refund
    - _Requirements: 1.3, 7.1, 8.1_

- [ ] 10. Checkpoint - Ensure API layer works correctly
  - Run all integration tests
  - Test API routes with Postman or similar tool
  - Verify error handling and validation
  - Ask the user if questions arise

- [ ] 11. Implement Provider Dashboard UI components
  - [ ] 11.1 Create BaseRatesForm component
    - Form fields for hourly rate, diagnostic fee, emergency rate, service call fee
    - All fields optional with clear labels
    - Validation for non-negative values
    - Submit button calls PUT /api/providers/[id]/base-rates
    - Display success/error messages
    - _Requirements: 1.2, 1.3, 1.4_
  
  - [ ] 11.2 Create AvailableJobsList component
    - Fetch jobs from GET /api/providers/[id]/available-jobs
    - Display job cards with description, location, distance, posted date
    - Click handler navigates to quote submission form
    - Empty state message when no jobs available
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [ ] 11.3 Create QuoteSubmissionForm component
    - Form fields for labor cost, parts estimate, service fee, travel fee, other fees, notes
    - Auto-calculate and display total amount
    - Validation for required fields and non-negative values
    - Validation that total equals sum of components
    - Submit button calls POST /api/quotes
    - Display success/error messages
    - _Requirements: 3.2, 3.3, 3.4, 3.5_
  
  - [ ] 11.4 Create ProviderQuotesList component
    - Fetch quotes from GET /api/quotes/provider/[providerId]
    - Display quote cards with job details, amount, date, status
    - Filter dropdown for status (all, pending, accepted, rejected)
    - Highlight accepted quotes prominently
    - Sort by submission date descending
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [ ] 11.5 Create ActiveJobsList component
    - Fetch jobs from provider's accepted quotes
    - Display job cards with details, payment status, homeowner contact
    - "Mark Complete" button calls POST /api/jobs/[id]/complete
    - Display completed jobs with payment confirmation
    - _Requirements: 11.1, 11.2, 11.3, 11.5_
  
  - [ ] 11.6 Update Provider Dashboard page to include new components
    - Add tabs or sections for: Base Rates, Available Jobs, My Quotes, Active Jobs
    - Wire up all components with proper routing
    - Add loading states and error handling
    - _Requirements: 9.1, 10.1, 11.1_

- [ ] 12. Implement Homeowner Dashboard UI components
  - [ ] 12.1 Create JobQuotesList component
    - Fetch quotes from GET /api/quotes?jobRequestId=[id]
    - Display quote cards with provider info, rating, total, breakdown, notes, distance
    - Sort by submission date descending
    - Price range filter inputs
    - "Accept Quote" button calls POST /api/quotes/[id]/accept
    - Display payment authorization status after acceptance
    - Empty state message when no quotes received
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ] 12.2 Create HomeownerJobsList component
    - Fetch jobs from homeowner's job requests
    - Display job cards with description, posted date, quote count
    - Status filter dropdown (open, quoted, accepted, completed, cancelled)
    - Highlight jobs with new quotes since last view
    - Click handler navigates to quote viewing page
    - _Requirements: 12.1, 12.2, 12.3, 12.5_
  
  - [ ] 12.3 Create AcceptedJobsList component
    - Fetch jobs with accepted quotes
    - Display job cards with provider name, quote amount, payment status, job status
    - Show payment status badge (authorized, captured, refunded)
    - Display total amount paid and cost breakdown
    - "Cancel Job" button calls POST /api/jobs/[id]/cancel (if not completed)
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  
  - [ ] 12.4 Update Homeowner Dashboard page to include new components
    - Add tabs or sections for: My Jobs, Accepted Jobs
    - Wire up all components with proper routing
    - Add loading states and error handling
    - _Requirements: 12.1, 13.1_

- [ ] 13. Implement Provider Profile display updates
  - [ ] 13.1 Update ProviderProfileCard component
    - Display configured base rates with labels
    - Omit null/empty rates from display
    - Show disclaimer text about rates being guidelines
    - Display most relevant rate (hourly or service call fee) prominently
    - _Requirements: 1.5, 2.1, 2.2, 2.3, 2.4_
  
  - [ ] 13.2 Update ProviderProfilePage component
    - Display all configured base rates in dedicated section
    - Show disclaimer about rates being guidelines
    - Maintain existing profile information display
    - _Requirements: 1.5, 2.1, 2.2, 2.3_

- [ ] 14. Implement audit trail and data integrity
  - [ ] 14.1 Create audit logging utility
    - Function to log quote status changes with timestamp and old/new status
    - Function to log payment status changes with timestamp and old/new status
    - Store audit records in database (create AuditLog model if needed)
    - _Requirements: 14.4, 14.5_
  
  - [ ] 14.2 Integrate audit logging into services
    - Add audit logging to QuoteService.acceptQuote (status changes)
    - Add audit logging to PaymentService.authorizePayment (status change to AUTHORIZED)
    - Add audit logging to PaymentService.capturePayment (status change to CAPTURED)
    - Add audit logging to PaymentService.cancelPayment (status change to REFUNDED)
    - _Requirements: 14.4, 14.5_
  
  - [ ] 14.3 Write property test for transaction rollback
    - **Property 47: Transaction rollback on failure**
    - **Validates: Requirements 14.3**

- [ ] 15. Final integration and testing
  - [ ] 15.1 Write end-to-end integration tests
    - Test complete quote-to-payment flow (submit → accept → complete)
    - Test cancellation flow (submit → accept → cancel)
    - Test multiple providers quoting on same job
    - Test payment authorization failure handling
    - _Requirements: 3.6, 5.5, 6.1, 7.1, 8.1_
  
  - [ ] 15.2 Manual testing checklist
    - Test as provider: set base rates, view available jobs, submit quotes, view quote status, complete jobs
    - Test as homeowner: create job, view quotes, accept quote, view payment status, cancel job
    - Test error scenarios: invalid quote totals, payment failures, unauthorized access
    - Test notifications are sent for all events
    - Verify Stripe test mode integration works correctly
  
  - [ ] 15.3 Update documentation
    - Add API documentation for new routes
    - Document Stripe integration setup
    - Document database schema changes
    - Add user guide for quote and payment features

- [ ] 16. Final checkpoint - Ensure everything works end-to-end
  - Run full test suite (unit, property, integration tests)
  - Verify all 49 correctness properties are tested
  - Test in browser with real user flows
  - Ask the user if questions arise

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end flows
- Use Prisma transactions for multi-step operations (quote acceptance + payment authorization)
- Use Stripe test mode for all development and testing
- All monetary values use Decimal type for precision
- Follow existing Next.js 14 app router patterns for API routes and pages
