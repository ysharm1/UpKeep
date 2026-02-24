# Instant Booking Backend - Requirements

## Overview
Complete the backend implementation for the instant booking flow. The UI is already built - we just need to wire up the API endpoints and payment logic.

---

## User Stories

### 1. Provider Diagnostic Fee Management
**As a provider**, I want to set my diagnostic visit fee so homeowners know what they'll pay upfront.

**Acceptance Criteria:**
- 1.1 Provider can set diagnostic fee between $50-$150
- 1.2 Diagnostic fee is stored in ServiceProviderProfile
- 1.3 Diagnostic fee is displayed to homeowners when browsing providers
- 1.4 Provider can update diagnostic fee at any time

### 2. Instant Diagnostic Booking
**As a homeowner**, I want to instantly book a diagnostic visit with a provider so I can get help quickly.

**Acceptance Criteria:**
- 2.1 Homeowner can book diagnostic visit with one click
- 2.2 Payment is authorized (not captured) for diagnostic fee
- 2.3 Job status updates to 'diagnostic_scheduled'
- 2.4 Provider receives booking notification
- 2.5 Payment intent ID is stored with job

### 3. Provider Nearby Search
**As a homeowner**, I want to see nearby providers with their diagnostic fees so I can choose who to book.

**Acceptance Criteria:**
- 3.1 System finds providers within service area
- 3.2 Providers are filtered by specialty matching job category
- 3.3 Results include diagnostic fee, rating, distance
- 3.4 Results are sorted by distance
- 3.5 Maximum 5 providers returned

### 4. Repair Quote Submission
**As a provider**, I want to submit a repair quote after diagnosing the problem so the homeowner can approve the work.

**Acceptance Criteria:**
- 4.1 Provider can enter labor cost, parts cost, and notes
- 4.2 Total amount is calculated automatically
- 4.3 Quote is saved with status 'PENDING'
- 4.4 Job status updates to 'repair_pending_approval'
- 4.5 Homeowner receives notification

### 5. Repair Quote Approval
**As a homeowner**, I want to approve a repair quote so the provider can proceed with the work.

**Acceptance Criteria:**
- 5.1 Homeowner can view repair quote details
- 5.2 Homeowner can approve or decline quote
- 5.3 On approval, repair payment is authorized (not captured)
- 5.4 Quote status updates to 'APPROVED'
- 5.5 Job status updates to 'repair_approved'
- 5.6 Provider receives approval notification
- 5.7 Repair payment intent ID is stored with job

### 6. Job Completion and Payment Capture
**As a provider**, I want to mark a job complete so I can receive payment.

**Acceptance Criteria:**
- 6.1 Provider can mark job as complete
- 6.2 Both payment intents (diagnostic + repair) are captured
- 6.3 Platform fee (15%) is calculated correctly
- 6.4 Provider receives 85% of total amount
- 6.5 Payment record is created with all amounts
- 6.6 Job status updates to 'completed'
- 6.7 Both parties receive completion notification

### 7. Error Handling
**As a user**, I want clear error messages when something goes wrong so I know what to do.

**Acceptance Criteria:**
- 7.1 All API endpoints have try-catch error handling
- 7.2 Stripe errors are caught and translated to user-friendly messages
- 7.3 Validation errors return 400 with clear messages
- 7.4 Authorization errors return 401 with clear messages
- 7.5 Not found errors return 404 with clear messages
- 7.6 Server errors return 500 with generic message (log details)

### 8. Loading States
**As a user**, I want to see loading indicators so I know the app is working.

**Acceptance Criteria:**
- 8.1 All buttons show loading state during API calls
- 8.2 Buttons are disabled during loading
- 8.3 Loading spinners are visible
- 8.4 Success/error messages appear after completion

---

## Technical Requirements

### Database Schema Changes
- Add `diagnosticFee` field to ServiceProviderProfile (Decimal, optional)
- Create RepairQuote model with fields: id, jobRequestId, providerId, laborCost, partsCost, totalAmount, notes, status, createdAt
- Add `diagnosticPaymentIntentId` and `repairPaymentIntentId` to JobRequest
- Add new JobStatus values: diagnostic_scheduled, diagnostic_completed, repair_pending_approval, repair_approved

### API Endpoints
- `PUT /api/providers/[id]/diagnostic-fee` - Set diagnostic fee
- `GET /api/providers/nearby` - Find nearby providers
- `POST /api/bookings` - Book diagnostic visit
- `POST /api/jobs/[id]/repair-quote` - Submit repair quote
- `GET /api/jobs/[id]/repair-quote` - Get repair quote
- `POST /api/jobs/[id]/approve-repair` - Approve repair quote
- `POST /api/jobs/[id]/complete` - Mark job complete

### Payment Flow
- Use Stripe PaymentIntent with `capture_method: 'manual'`
- Create separate payment intents for diagnostic and repair
- Store payment intent IDs in JobRequest
- Capture both intents when job is marked complete
- Calculate 15% platform fee, transfer 85% to provider

### Security
- All endpoints require authentication
- Validate user has permission for actions (provider can only submit quotes for their jobs, etc.)
- Validate all input data
- Use parameterized queries (Prisma handles this)

### Performance
- Add database indexes on frequently queried fields
- Use Prisma connection pooling
- Optimize nearby provider search with geographic queries

---

## Out of Scope (Post-Launch)
- Real-time notifications (WebSocket)
- Email/SMS notifications
- Push notifications
- Provider payout automation (Stripe Connect)
- Dispute resolution
- Refund handling
- Multiple payment methods
- Subscription plans
