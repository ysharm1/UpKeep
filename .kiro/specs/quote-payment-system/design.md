# Design Document: Quote and Payment System

## Overview

The quote and payment system extends the UpKeep platform with a hybrid pricing model that allows service providers to set optional base rates on their profiles and submit custom quotes for specific jobs. Homeowners can view, compare, and accept quotes, triggering a secure payment flow through Stripe with a 15% platform fee. The system uses Stripe payment intents to authorize funds when quotes are accepted and captures payment upon job completion.

The design follows the existing Next.js 14 + TypeScript + Prisma + PostgreSQL architecture and integrates with the current authentication, job request, and payment infrastructure.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                         │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Provider         │  │ Homeowner        │                │
│  │ Dashboard        │  │ Dashboard        │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Routes Layer                         │
│  /api/quotes/*  /api/payments/*  /api/providers/*           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Quote        │  │ Payment      │  │ Notification │     │
│  │ Service      │  │ Service      │  │ Service      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Data Access Layer                           │
│                  Prisma ORM + PostgreSQL                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  External Services                           │
│                  Stripe Payment API                          │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Quote Submission Flow:**
1. Provider views available jobs → GET /api/jobs/available
2. Provider submits quote → POST /api/quotes
3. Quote service validates and stores quote
4. Notification service notifies homeowner
5. Homeowner views quotes → GET /api/quotes?jobRequestId={id}

**Payment Flow:**
1. Homeowner accepts quote → POST /api/quotes/{id}/accept
2. Quote service marks quote as accepted
3. Payment service creates Stripe payment intent (authorize only)
4. Payment intent ID stored with job
5. Provider marks job complete → POST /api/jobs/{id}/complete
6. Payment service captures payment and transfers to provider

## Components and Interfaces

### Database Schema Extensions

```prisma
model ServiceProviderProfile {
  id                  String   @id @default(cuid())
  userId              String   @unique
  // ... existing fields ...
  
  // Base rates (optional)
  hourlyRate          Decimal? @db.Decimal(10, 2)
  diagnosticFee       Decimal? @db.Decimal(10, 2)
  emergencyRate       Decimal? @db.Decimal(10, 2)
  serviceCallFee      Decimal? @db.Decimal(10, 2)
  
  quotes              Quote[]
  updatedAt           DateTime @updatedAt
}

model Quote {
  id                  String   @id @default(cuid())
  jobRequestId        String
  providerId          String
  
  // Cost breakdown
  laborCost           Decimal  @db.Decimal(10, 2)
  partsEstimate       Decimal  @db.Decimal(10, 2)
  serviceFee          Decimal? @db.Decimal(10, 2)
  travelFee           Decimal? @db.Decimal(10, 2)
  otherFees           Decimal? @db.Decimal(10, 2)
  totalAmount         Decimal  @db.Decimal(10, 2)
  
  // Metadata
  notes               String?  @db.Text
  status              QuoteStatus @default(PENDING)
  
  // Relationships
  jobRequest          JobRequest @relation(fields: [jobRequestId], references: [id])
  provider            ServiceProviderProfile @relation(fields: [providerId], references: [id])
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@index([jobRequestId])
  @@index([providerId])
  @@index([status])
}

enum QuoteStatus {
  PENDING
  ACCEPTED
  REJECTED
}

model JobRequest {
  id                  String   @id @default(cuid())
  // ... existing fields ...
  
  quotes              Quote[]
  acceptedQuoteId     String?  @unique
  acceptedQuote       Quote?   @relation("AcceptedQuote", fields: [acceptedQuoteId], references: [id])
  
  status              JobStatus @default(OPEN)
  completedAt         DateTime?
}

enum JobStatus {
  OPEN
  QUOTED
  ACCEPTED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model Payment {
  id                  String   @id @default(cuid())
  // ... existing fields ...
  
  jobRequestId        String?  @unique
  quoteId             String?  @unique
  stripePaymentIntentId String? @unique
  
  amount              Decimal  @db.Decimal(10, 2)
  platformFee         Decimal  @db.Decimal(10, 2)
  providerPayout      Decimal  @db.Decimal(10, 2)
  
  status              PaymentStatus @default(PENDING)
  
  jobRequest          JobRequest? @relation(fields: [jobRequestId], references: [id])
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

enum PaymentStatus {
  PENDING
  AUTHORIZED
  CAPTURED
  REFUNDED
  FAILED
}
```

### Service Interfaces

#### Quote Service

```typescript
// lib/quotes/quote.service.ts

interface QuoteCreateInput {
  jobRequestId: string;
  providerId: string;
  laborCost: number;
  partsEstimate: number;
  serviceFee?: number;
  travelFee?: number;
  otherFees?: number;
  totalAmount: number;
  notes?: string;
}

interface QuoteWithProvider {
  id: string;
  jobRequestId: string;
  providerId: string;
  laborCost: number;
  partsEstimate: number;
  serviceFee: number | null;
  travelFee: number | null;
  otherFees: number | null;
  totalAmount: number;
  notes: string | null;
  status: QuoteStatus;
  createdAt: Date;
  provider: {
    id: string;
    businessName: string;
    rating: number;
    location: string;
  };
  distance?: number;
}

class QuoteService {
  // Create a new quote
  async createQuote(input: QuoteCreateInput): Promise<Quote>
  
  // Get all quotes for a job request
  async getQuotesByJobRequest(jobRequestId: string): Promise<QuoteWithProvider[]>
  
  // Get all quotes by a provider
  async getQuotesByProvider(providerId: string): Promise<Quote[]>
  
  // Accept a quote (marks others as rejected)
  async acceptQuote(quoteId: string, homeownerId: string): Promise<Quote>
  
  // Validate quote totals match breakdown
  validateQuoteTotals(input: QuoteCreateInput): boolean
  
  // Calculate distance between provider and job
  async calculateDistance(providerId: string, jobRequestId: string): Promise<number>
}
```

#### Payment Service Extensions

```typescript
// lib/payments/payment.service.ts

const PLATFORM_FEE_PERCENTAGE = 0.15;

interface PaymentAuthorizationInput {
  quoteId: string;
  jobRequestId: string;
  amount: number;
  homeownerId: string;
}

interface PaymentCaptureInput {
  paymentId: string;
  jobRequestId: string;
}

class PaymentService {
  // Existing methods...
  
  // Authorize payment when quote is accepted
  async authorizePayment(input: PaymentAuthorizationInput): Promise<Payment>
  
  // Capture payment when job is completed
  async capturePayment(input: PaymentCaptureInput): Promise<Payment>
  
  // Cancel payment intent and refund if needed
  async cancelPayment(paymentId: string): Promise<Payment>
  
  // Calculate platform fee and provider payout
  calculateFees(amount: number): {
    platformFee: number;
    providerPayout: number;
  }
  
  // Create Stripe payment intent
  private async createPaymentIntent(amount: number, customerId: string): Promise<string>
  
  // Capture Stripe payment intent
  private async capturePaymentIntent(paymentIntentId: string): Promise<void>
  
  // Cancel Stripe payment intent
  private async cancelPaymentIntent(paymentIntentId: string): Promise<void>
}
```

#### Provider Service Extensions

```typescript
// lib/providers/provider.service.ts

interface BaseRatesInput {
  hourlyRate?: number;
  diagnosticFee?: number;
  emergencyRate?: number;
  serviceCallFee?: number;
}

class ProviderService {
  // Existing methods...
  
  // Update provider base rates
  async updateBaseRates(providerId: string, rates: BaseRatesInput): Promise<ServiceProviderProfile>
  
  // Get available jobs for provider (matching categories, no existing quote)
  async getAvailableJobs(providerId: string): Promise<JobRequest[]>
  
  // Get active jobs for provider (accepted quotes)
  async getActiveJobs(providerId: string): Promise<JobRequest[]>
}
```

### API Routes

```typescript
// app/api/quotes/route.ts
POST /api/quotes
  Body: QuoteCreateInput
  Response: Quote
  
GET /api/quotes?jobRequestId={id}
  Response: QuoteWithProvider[]

// app/api/quotes/[id]/accept/route.ts
POST /api/quotes/[id]/accept
  Response: { quote: Quote, payment: Payment }

// app/api/quotes/provider/[providerId]/route.ts
GET /api/quotes/provider/[providerId]
  Response: Quote[]

// app/api/providers/[id]/base-rates/route.ts
PUT /api/providers/[id]/base-rates
  Body: BaseRatesInput
  Response: ServiceProviderProfile

// app/api/providers/[id]/available-jobs/route.ts
GET /api/providers/[id]/available-jobs
  Response: JobRequest[]

// app/api/jobs/[id]/complete/route.ts
POST /api/jobs/[id]/complete
  Response: { job: JobRequest, payment: Payment }

// app/api/jobs/[id]/cancel/route.ts
POST /api/jobs/[id]/cancel
  Response: { job: JobRequest, payment: Payment }
```

## Data Models

### Quote Model

The Quote model represents a price proposal from a provider for a specific job. It includes:

- **Cost Breakdown**: Labor, parts, service fees, travel fees, and other fees
- **Total Amount**: Sum of all cost components
- **Status**: PENDING (submitted), ACCEPTED (chosen by homeowner), REJECTED (not chosen)
- **Metadata**: Notes from provider, timestamps
- **Relationships**: Links to JobRequest and ServiceProviderProfile

**Validation Rules:**
- All monetary values must be non-negative
- Total amount must equal sum of all cost components
- Only one quote per job can be ACCEPTED
- Provider cannot submit multiple quotes for same job

### Payment Model Extensions

The Payment model is extended to support the quote-based payment flow:

- **Quote Reference**: Links payment to accepted quote
- **Job Reference**: Links payment to job request
- **Stripe Payment Intent ID**: Stores Stripe's payment intent identifier
- **Fee Breakdown**: Platform fee (15%) and provider payout (85%)
- **Status Tracking**: PENDING → AUTHORIZED → CAPTURED or REFUNDED

**State Transitions:**
- PENDING: Initial state when payment record created
- AUTHORIZED: Stripe payment intent created, funds reserved
- CAPTURED: Payment completed, funds transferred to provider
- REFUNDED: Payment cancelled, funds returned to homeowner
- FAILED: Payment authorization or capture failed

### ServiceProviderProfile Extensions

The ServiceProviderProfile model is extended with optional base rates:

- **Hourly Rate**: General hourly billing rate
- **Diagnostic Fee**: Fee for initial assessment visits
- **Emergency Rate**: Premium rate for urgent/after-hours work
- **Service Call Fee**: Flat fee for service visits

These rates are optional and serve as guidelines. Providers can quote differently for each job.

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Input Validation Properties

**Property 1: Base rate non-negativity**
*For any* base rate update (hourly, diagnostic, emergency, service call), all provided rate values must be non-negative, and negative values must be rejected.
**Validates: Requirements 1.2**

**Property 2: Quote monetary value non-negativity**
*For any* quote submission, all monetary fields (labor cost, parts estimate, service fee, travel fee, other fees, total amount) must be non-negative, and submissions with negative values must be rejected.
**Validates: Requirements 3.5**

**Property 3: Quote total equals sum of components**
*For any* quote submission, the total amount must equal the sum of labor cost, parts estimate, and all optional fees (service, travel, other), and submissions where this doesn't hold must be rejected.
**Validates: Requirements 3.4**

**Property 4: Required quote fields**
*For any* quote submission, labor cost, parts estimate, and total amount must be provided, and submissions missing any of these fields must be rejected.
**Validates: Requirements 3.2**

**Property 5: Optional quote fields**
*For any* quote submission, service fees, travel fees, other fees, and notes may be omitted or provided, and both cases must be accepted as valid.
**Validates: Requirements 3.3**

### Data Persistence Properties

**Property 6: Base rate round-trip**
*For any* valid base rate configuration, saving the rates and then retrieving the provider profile must return the same rate values.
**Validates: Requirements 1.3**

**Property 7: Base rate optionality**
*For any* combination of base rate fields (including all empty, all filled, or partially filled), the system must accept and persist the configuration.
**Validates: Requirements 1.4**

**Property 8: Quote persistence round-trip**
*For any* valid quote, creating the quote and then retrieving it must return the same cost breakdown, metadata, and associations (job request ID, provider ID).
**Validates: Requirements 3.6, 14.1**

**Property 9: Payment persistence round-trip**
*For any* valid payment, creating the payment and then retrieving it must return the same amount, fee breakdown, and associations (job request ID, quote ID, payment intent ID).
**Validates: Requirements 14.2**

**Property 10: Multiple quotes per job**
*For any* job request, multiple providers can submit quotes, and all submitted quotes must be stored and retrievable.
**Validates: Requirements 3.7**

### Quote Management Properties

**Property 11: Quote acceptance exclusivity**
*For any* job request with multiple quotes, accepting one quote must mark that quote as ACCEPTED and all other quotes for that job as REJECTED.
**Validates: Requirements 5.1, 5.2**

**Property 12: Single acceptance per job**
*For any* job request, after a quote is accepted, attempting to accept another quote for that job must be rejected.
**Validates: Requirements 5.3**

**Property 13: Quote list completeness**
*For any* job request, retrieving quotes for that job must return all quotes submitted by any provider for that job.
**Validates: Requirements 4.1**

**Property 14: Quote sorting by date**
*For any* list of quotes (whether for a job or by a provider), the returned list must be sorted by submission date in descending order (newest first).
**Validates: Requirements 4.3, 10.4**

**Property 15: Quote filtering by price range**
*For any* price range filter (min, max) applied to a job's quotes, all returned quotes must have total amounts within that range (inclusive).
**Validates: Requirements 4.4**

**Property 16: Quote filtering by status**
*For any* status filter (PENDING, ACCEPTED, REJECTED) applied to a provider's quotes, all returned quotes must have that status.
**Validates: Requirements 10.3**

### Payment Flow Properties

**Property 17: Payment authorization on quote acceptance**
*For any* accepted quote, a payment record must be created with status AUTHORIZED and amount equal to the quote total.
**Validates: Requirements 5.5, 6.1, 6.2**

**Property 18: Payment intent storage**
*For any* successful payment authorization, the payment intent ID must be stored and retrievable from the job request.
**Validates: Requirements 6.3**

**Property 19: Payment authorization failure rollback**
*For any* quote acceptance where payment authorization fails, the quote status must revert to PENDING and a notification must be created for the homeowner.
**Validates: Requirements 6.4**

**Property 20: Platform fee calculation**
*For any* quote amount, the platform fee must equal 15% of the amount (amount × 0.15) and the provider payout must equal 85% of the amount (amount × 0.85).
**Validates: Requirements 6.5, 6.6**

**Property 21: Payment capture on job completion**
*For any* job with AUTHORIZED payment, marking the job as complete must change the payment status to CAPTURED and the job status to COMPLETED.
**Validates: Requirements 7.1, 7.5**

**Property 22: Payment cancellation before completion**
*For any* job with AUTHORIZED payment that is cancelled before completion, the payment status must change to REFUNDED and the job status to CANCELLED.
**Validates: Requirements 8.1, 8.5**

**Property 23: Payment refund after capture**
*For any* job with CAPTURED payment that is cancelled, the payment status must change to REFUNDED.
**Validates: Requirements 8.2**

**Property 24: Cancellation by either party**
*For any* job that is not yet completed, cancellation requests from either the homeowner or the provider must be accepted and processed.
**Validates: Requirements 8.4**

### Display and Filtering Properties

**Property 25: Base rate display completeness**
*For any* provider profile, all non-null base rates must appear in the rendered profile display with appropriate labels.
**Validates: Requirements 1.5, 2.1**

**Property 26: Base rate display exclusion**
*For any* provider profile, null base rates must not appear in the rendered profile display.
**Validates: Requirements 2.2**

**Property 27: Provider card rate selection**
*For any* provider profile displayed on a card, if hourly rate is configured it must be shown, otherwise if service call fee is configured it must be shown.
**Validates: Requirements 2.4**

**Property 28: Job details display completeness**
*For any* job request viewed by a provider, the rendered display must include description, location, and homeowner information.
**Validates: Requirements 3.1**

**Property 29: Quote display completeness**
*For any* quote displayed to a homeowner, the rendered display must include provider name, rating, total price, cost breakdown, notes, and distance.
**Validates: Requirements 4.2**

**Property 30: Available jobs filtering**
*For any* provider, the available jobs list must include only jobs that match the provider's service categories, exclude jobs where the provider already submitted a quote, and exclude jobs with accepted quotes.
**Validates: Requirements 9.1, 9.3, 9.4**

**Property 31: Available jobs display completeness**
*For any* job in the available jobs list, the rendered display must include job description, location, distance, and posted date.
**Validates: Requirements 9.2**

**Property 32: Provider quotes display completeness**
*For any* quote in the provider's quote list, the rendered display must include job details, quote amount, submission date, and status.
**Validates: Requirements 10.2**

**Property 33: Provider active jobs filtering**
*For any* provider, the active jobs list must include only jobs where the provider's quote was accepted.
**Validates: Requirements 11.1**

**Property 34: Active jobs display completeness**
*For any* job in the active jobs list, the rendered display must include job details, payment status, and homeowner contact information.
**Validates: Requirements 11.2**

**Property 35: Homeowner jobs display completeness**
*For any* job in the homeowner's job list, the rendered display must include job description, posted date, and number of quotes received.
**Validates: Requirements 12.2**

**Property 36: Homeowner jobs filtering by status**
*For any* status filter (OPEN, QUOTED, ACCEPTED, COMPLETED, CANCELLED) applied to homeowner's jobs, all returned jobs must have that status.
**Validates: Requirements 12.3**

**Property 37: Homeowner accepted jobs filtering**
*For any* homeowner, the accepted jobs list must include only jobs with accepted quotes.
**Validates: Requirements 13.1**

**Property 38: Accepted jobs display completeness**
*For any* job in the accepted jobs list, the rendered display must include provider name, quote amount, payment status, job status, total amount paid, and cost breakdown.
**Validates: Requirements 13.2, 13.5**

**Property 39: Payment status validity**
*For any* displayed payment status, the value must be one of PENDING, AUTHORIZED, CAPTURED, or REFUNDED.
**Validates: Requirements 13.3**

### Notification Properties

**Property 40: Quote submission notification**
*For any* successfully submitted quote, a notification must be created for the homeowner.
**Validates: Requirements 3.8, 15.1**

**Property 41: Quote acceptance notification**
*For any* accepted quote, a notification must be created for the provider whose quote was accepted.
**Validates: Requirements 5.4, 15.2**

**Property 42: Quote rejection notification**
*For any* rejected quote (when another quote is accepted), a notification must be created for the provider whose quote was rejected.
**Validates: Requirements 15.3**

**Property 43: Payment authorization failure notification**
*For any* failed payment authorization, a notification must be created for the homeowner.
**Validates: Requirements 15.4**

**Property 44: Job completion notification**
*For any* completed job with captured payment, notifications must be created for both the homeowner and the provider.
**Validates: Requirements 7.6, 15.5, 15.6**

**Property 45: Payment capture failure notification**
*For any* failed payment capture, notifications must be created for both the homeowner and the provider.
**Validates: Requirements 7.4**

**Property 46: Cancellation notification**
*For any* cancelled job with refunded payment, notifications must be created for both the homeowner and the provider.
**Validates: Requirements 8.3, 15.7**

### Data Integrity Properties

**Property 47: Transaction rollback on failure**
*For any* database operation that fails, no partial changes must be committed and the system must maintain data consistency.
**Validates: Requirements 14.3**

**Property 48: Quote status audit trail**
*For any* quote status change (PENDING → ACCEPTED or PENDING → REJECTED), an audit record must be created with timestamp and old/new status.
**Validates: Requirements 14.4**

**Property 49: Payment status audit trail**
*For any* payment status change (PENDING → AUTHORIZED → CAPTURED or REFUNDED), an audit record must be created with timestamp and old/new status.
**Validates: Requirements 14.5**

## Error Handling

### Validation Errors

**Quote Validation:**
- Invalid total amount (doesn't match sum): Return 400 with detailed error message
- Negative monetary values: Return 400 with field-specific error
- Missing required fields: Return 400 with list of missing fields
- Provider already quoted on job: Return 409 with conflict message

**Payment Errors:**
- Stripe payment intent creation failure: Return 500, log error, notify homeowner
- Payment authorization failure: Revert quote acceptance, return 500, notify homeowner
- Payment capture failure: Maintain AUTHORIZED status, return 500, notify both parties
- Insufficient funds: Return 402, notify homeowner with payment method update instructions

**Quote Acceptance Errors:**
- Quote already accepted for job: Return 409 with conflict message
- Quote not found: Return 404
- Unauthorized user (not job owner): Return 403
- Job already completed/cancelled: Return 400 with status message

### Database Errors

**Transaction Failures:**
- Use Prisma transactions for multi-step operations (quote acceptance + payment creation)
- On failure: Roll back all changes, log error, return 500
- Retry logic for transient failures (connection issues)

**Constraint Violations:**
- Unique constraint on acceptedQuoteId: Return 409
- Foreign key violations: Return 400 with relationship error
- Null constraint violations: Return 400 with required field error

### External Service Errors

**Stripe API Failures:**
- Network timeout: Retry up to 3 times with exponential backoff
- API error: Log full error details, return user-friendly message
- Webhook failures: Queue for retry, alert on repeated failures
- Idempotency: Use idempotency keys for all Stripe requests

**Distance Calculation Failures:**
- Geocoding API failure: Return null distance, don't block quote submission
- Invalid addresses: Return null distance with warning message

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples, edge cases, and error conditions:

**Quote Service Tests:**
- Valid quote creation with all fields
- Valid quote creation with only required fields
- Quote creation with invalid total (doesn't match sum)
- Quote creation with negative values
- Multiple quotes for same job
- Quote acceptance marking others as rejected
- Quote acceptance with payment authorization failure

**Payment Service Tests:**
- Fee calculation with various amounts (including edge cases like $0.01, $999999.99)
- Payment authorization success flow
- Payment authorization failure handling
- Payment capture success flow
- Payment capture failure handling
- Payment cancellation before capture
- Payment refund after capture

**Provider Service Tests:**
- Base rate updates with all fields
- Base rate updates with partial fields
- Base rate updates with null values
- Available jobs filtering (matching categories, no existing quote, no accepted quote)
- Active jobs filtering (only accepted quotes)

**Dashboard Tests:**
- Empty state displays (no quotes, no jobs)
- Single item displays
- Sorting and filtering logic
- Status-based filtering

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using a TypeScript property testing library (fast-check):

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: quote-payment-system, Property {number}: {property_text}`
- Use custom generators for domain objects (Quote, Payment, JobRequest, etc.)

**Test Organization:**
- Group tests by service (QuoteService, PaymentService, ProviderService)
- Each correctness property implemented as a single property test
- Use property test for validation rules, calculations, and invariants
- Use unit tests for specific examples and integration points

**Key Property Tests:**
- Property 3: Quote total validation (generate random cost breakdowns)
- Property 11: Quote acceptance exclusivity (generate job with multiple quotes)
- Property 20: Fee calculation (generate random amounts, verify 15%/85% split)
- Property 21: Payment capture on completion (generate job lifecycle)
- Property 30: Available jobs filtering (generate provider with categories and jobs)

### Integration Testing

Integration tests will verify end-to-end flows:

**Quote to Payment Flow:**
1. Create job request
2. Submit multiple quotes from different providers
3. Accept one quote
4. Verify payment authorization
5. Complete job
6. Verify payment capture
7. Verify notifications sent

**Cancellation Flow:**
1. Create job with accepted quote and authorized payment
2. Cancel job
3. Verify payment refunded
4. Verify notifications sent

**Stripe Integration:**
- Use Stripe test mode for all tests
- Verify payment intent creation with correct amount
- Verify payment intent capture
- Verify payment intent cancellation
- Test webhook handling for payment events

### Test Data Generators

**Custom Generators for Property Tests:**

```typescript
// Generate valid quote input
const quoteInputGen = fc.record({
  jobRequestId: fc.uuid(),
  providerId: fc.uuid(),
  laborCost: fc.double({ min: 0, max: 10000, noNaN: true }),
  partsEstimate: fc.double({ min: 0, max: 10000, noNaN: true }),
  serviceFee: fc.option(fc.double({ min: 0, max: 1000, noNaN: true })),
  travelFee: fc.option(fc.double({ min: 0, max: 500, noNaN: true })),
  otherFees: fc.option(fc.double({ min: 0, max: 1000, noNaN: true })),
  notes: fc.option(fc.string())
}).map(input => ({
  ...input,
  totalAmount: input.laborCost + input.partsEstimate + 
    (input.serviceFee || 0) + (input.travelFee || 0) + (input.otherFees || 0)
}));

// Generate base rates with various combinations
const baseRatesGen = fc.record({
  hourlyRate: fc.option(fc.double({ min: 0, max: 500, noNaN: true })),
  diagnosticFee: fc.option(fc.double({ min: 0, max: 200, noNaN: true })),
  emergencyRate: fc.option(fc.double({ min: 0, max: 1000, noNaN: true })),
  serviceCallFee: fc.option(fc.double({ min: 0, max: 200, noNaN: true }))
});

// Generate payment amounts for fee calculation
const paymentAmountGen = fc.double({ 
  min: 0.01, 
  max: 100000, 
  noNaN: true 
});
```

## Implementation Notes

### Prisma Migration Strategy

1. Create migration for new models (Quote) and enum types (QuoteStatus, JobStatus, PaymentStatus)
2. Add fields to existing models (ServiceProviderProfile, JobRequest, Payment)
3. Run migration in development, verify schema
4. Test with seed data before production deployment

### Stripe Integration

**Payment Intent Flow:**
1. Create payment intent with `capture_method: 'manual'` for authorization
2. Store payment intent ID in Payment model
3. On job completion, call `paymentIntent.capture()`
4. Use Stripe Connect for provider payouts (requires provider onboarding)

**Webhook Handling:**
- Listen for `payment_intent.succeeded` to confirm capture
- Listen for `payment_intent.payment_failed` to handle failures
- Listen for `charge.refunded` to confirm refunds
- Implement idempotent webhook handlers

### Distance Calculation

Use existing geocoding service or integrate with Google Maps Distance Matrix API:
- Cache provider and job coordinates
- Calculate straight-line distance for display
- Consider adding driving distance/time in future iteration

### Notification System

Leverage existing notification infrastructure:
- Create notification records in database
- Send email notifications for critical events (quote accepted, payment captured)
- Consider in-app notifications for real-time updates
- Batch notifications to avoid spam (daily digest for new quotes)

### Performance Considerations

**Database Indexes:**
- Index on Quote.jobRequestId for fast quote retrieval
- Index on Quote.providerId for provider dashboard queries
- Index on Quote.status for filtering
- Index on JobRequest.status for dashboard queries
- Composite index on (providerId, status) for provider quote filtering

**Query Optimization:**
- Use Prisma's `include` to fetch related data in single query
- Implement pagination for quote lists and job lists
- Cache provider base rates (rarely change)
- Use database views for complex dashboard queries

**Caching Strategy:**
- Cache provider profiles with base rates (TTL: 1 hour)
- Cache job request details (TTL: 5 minutes)
- Invalidate cache on updates
- Use Redis for distributed caching in production
