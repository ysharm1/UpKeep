# Instant Booking Backend - Design

## Architecture Overview

This design implements the backend API endpoints and payment logic for the instant booking flow. The frontend UI is already complete - we're wiring up the backend to make it functional.

---

## Database Schema

### ServiceProviderProfile Updates
```prisma
model ServiceProviderProfile {
  // ... existing fields
  diagnosticFee  Decimal?  @db.Decimal(10, 2)  // NEW: $50-150
}
```

### New RepairQuote Model
```prisma
model RepairQuote {
  id            String      @id @default(cuid())
  jobRequestId  String      @unique
  providerId    String
  laborCost     Decimal     @db.Decimal(10, 2)
  partsCost     Decimal     @db.Decimal(10, 2)
  totalAmount   Decimal     @db.Decimal(10, 2)
  notes         String?     @db.Text
  status        QuoteStatus @default(PENDING)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  jobRequest    JobRequest  @relation(fields: [jobRequestId], references: [id])
  provider      User        @relation(fields: [providerId], references: [id])
  
  @@index([jobRequestId])
  @@index([providerId])
}

enum QuoteStatus {
  PENDING
  APPROVED
  DECLINED
}
```

### JobRequest Updates
```prisma
model JobRequest {
  // ... existing fields
  diagnosticPaymentIntentId  String?  // NEW: Stripe payment intent for diagnostic
  repairPaymentIntentId      String?  // NEW: Stripe payment intent for repair
  repairQuote                RepairQuote?  // NEW: One-to-one relation
}
```

### JobStatus Updates
```prisma
enum JobStatus {
  submitted
  ai_diagnosis
  resolved_diy
  diagnostic_scheduled    // NEW
  diagnostic_completed    // NEW
  repair_pending_approval // NEW
  repair_approved         // NEW
  pending_match
  matched
  accepted
  in_progress
  completed
  cancelled
}
```

### Performance Indexes
```prisma
model JobRequest {
  @@index([status])
  @@index([category])
  @@index([createdAt])
}

model ServiceProviderProfile {
  @@index([specialties])
  @@index([isVerified])
}
```

---

## API Endpoints

### 1. Set Diagnostic Fee
**Endpoint:** `PUT /api/providers/[id]/diagnostic-fee`

**Request:**
```typescript
{
  diagnosticFee: number  // 50-150
}
```

**Response:**
```typescript
{
  success: true,
  profile: ServiceProviderProfile
}
```

**Logic:**
1. Authenticate user
2. Verify user is provider and owns profile
3. Validate fee is between $50-$150
4. Update ServiceProviderProfile.diagnosticFee
5. Return updated profile

**Errors:**
- 401: Not authenticated
- 403: Not authorized (not provider or not own profile)
- 400: Invalid fee amount

---

### 2. Find Nearby Providers
**Endpoint:** `GET /api/providers/nearby`

**Query Params:**
```typescript
{
  lat: number
  lng: number
  category: string
}
```

**Response:**
```typescript
{
  providers: Array<{
    id: string
    businessName: string
    diagnosticFee: number
    rating: number
    reviewCount: number
    distance: number  // miles
    specialties: string[]
    isVerified: boolean
  }>
}
```

**Logic:**
1. Query providers with matching specialty
2. Filter by service area (radius or zip codes)
3. Calculate distance from job location
4. Sort by distance
5. Return top 5 providers

**Errors:**
- 400: Missing required params

---

### 3. Book Diagnostic Visit
**Endpoint:** `POST /api/bookings`

**Request:**
```typescript
{
  jobRequestId: string
  providerId: string
}
```

**Response:**
```typescript
{
  success: true,
  booking: {
    jobId: string
    providerId: string
    diagnosticFee: number
    paymentIntentId: string
    status: 'diagnostic_scheduled'
  }
}
```

**Logic:**
1. Authenticate user (homeowner)
2. Get provider's diagnosticFee
3. Create Stripe PaymentIntent:
   ```typescript
   {
     amount: diagnosticFee * 100,  // Convert to cents
     currency: 'usd',
     capture_method: 'manual',
     metadata: {
       jobRequestId,
       providerId,
       type: 'diagnostic'
     }
   }
   ```
4. Update JobRequest:
   - Set diagnosticPaymentIntentId
   - Set status to 'diagnostic_scheduled'
   - Set assignedProviderId
5. Return booking confirmation

**Errors:**
- 401: Not authenticated
- 403: Not authorized (not homeowner or not own job)
- 404: Job or provider not found
- 400: Provider has no diagnostic fee set
- 500: Stripe error

---

### 4. Submit Repair Quote
**Endpoint:** `POST /api/jobs/[id]/repair-quote`

**Request:**
```typescript
{
  laborCost: number
  partsCost: number
  notes?: string
}
```

**Response:**
```typescript
{
  success: true,
  quote: RepairQuote
}
```

**Logic:**
1. Authenticate user (provider)
2. Verify provider is assigned to job
3. Validate costs are positive numbers
4. Calculate totalAmount = laborCost + partsCost
5. Create RepairQuote with status PENDING
6. Update JobRequest status to 'repair_pending_approval'
7. Send notification to homeowner (future: email/SMS)
8. Return created quote

**Errors:**
- 401: Not authenticated
- 403: Not authorized (not assigned provider)
- 404: Job not found
- 400: Invalid costs or quote already exists

---

### 5. Get Repair Quote
**Endpoint:** `GET /api/jobs/[id]/repair-quote`

**Response:**
```typescript
{
  quote: RepairQuote | null
}
```

**Logic:**
1. Authenticate user
2. Verify user is homeowner or assigned provider
3. Get RepairQuote for job
4. Return quote or null

**Errors:**
- 401: Not authenticated
- 403: Not authorized
- 404: Job not found

---

### 6. Approve Repair Quote
**Endpoint:** `POST /api/jobs/[id]/approve-repair`

**Response:**
```typescript
{
  success: true,
  paymentIntentId: string
  totalAmount: number
}
```

**Logic:**
1. Authenticate user (homeowner)
2. Verify user owns job
3. Get RepairQuote for job
4. Create Stripe PaymentIntent for repair:
   ```typescript
   {
     amount: quote.totalAmount * 100,
     currency: 'usd',
     capture_method: 'manual',
     metadata: {
       jobRequestId,
       quoteId: quote.id,
       type: 'repair'
     }
   }
   ```
5. Update JobRequest:
   - Set repairPaymentIntentId
   - Set status to 'repair_approved'
6. Update RepairQuote status to APPROVED
7. Send notification to provider
8. Return approval confirmation

**Errors:**
- 401: Not authenticated
- 403: Not authorized (not homeowner)
- 404: Job or quote not found
- 400: Quote already approved/declined
- 500: Stripe error

---

### 7. Capture Diagnostic Payment (After Visit)
**Endpoint:** `POST /api/jobs/[id]/capture-diagnostic`

**Response:**
```typescript
{
  success: true,
  captured: {
    amount: number
    paymentIntentId: string
  }
}
```

**Logic:**
1. Authenticate user (provider)
2. Verify provider is assigned to job
3. Get diagnostic payment intent ID
4. Capture diagnostic payment intent
5. Update job status to 'diagnostic_completed'
6. Return capture confirmation

**Errors:**
- 401: Not authenticated
- 403: Not authorized
- 404: Job not found
- 400: Already captured or no payment intent
- 500: Stripe error

---

### 8. Complete Job (Capture Repair Payment)
**Endpoint:** `POST /api/jobs/[id]/complete`

**Response:**
```typescript
{
  success: true,
  payment: {
    repairAmount: number
    totalAmount: number
    platformFee: number
    providerPayout: number
  }
}
```

**Logic:**
1. Authenticate user (provider)
2. Verify provider is assigned to job
3. Get repair payment intent ID
4. Capture repair payment intent
5. Calculate amounts:
   ```typescript
   const diagnosticAmount = await getDiagnosticAmount(diagnosticPaymentIntentId)
   const repairAmount = await getRepairAmount(repairPaymentIntentId)
   const totalAmount = diagnosticAmount + repairAmount
   const platformFee = totalAmount * 0.15
   const providerPayout = totalAmount * 0.85
   ```
6. Create Payment record with all amounts
7. Update job status to 'completed'
8. Return completion confirmation

**Errors:**
- 401: Not authenticated
- 403: Not authorized
- 404: Job not found
- 400: No repair payment or already completed
- 500: Stripe error

---

## Payment Flow

### Simplified Two-Step Strategy (MVP)

**Why This Flow?**
- Less friction for homeowners
- No pre-authorization before diagnostic visit
- Cleaner user experience
- Reduces drop-off

**Flow:**
```
1. Booking → Create diagnostic PaymentIntent (authorize only)
2. Provider visits → Capture diagnostic payment
3. Submit repair quote → Create repair PaymentIntent (authorize only)
4. Approve repair → Repair payment authorized
5. Complete job → Capture repair PaymentIntent
```

**Key Change from Original:**
- Diagnostic is captured AFTER visit (not at completion)
- Repair is authorized when approved (not before visit)
- This reduces complexity and feels more natural

**Stripe Configuration:**
```typescript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
})

// Create payment intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: amount * 100,  // Convert to cents
  currency: 'usd',
  capture_method: 'manual',  // Don't capture immediately
  metadata: {
    jobRequestId,
    type: 'diagnostic' | 'repair'
  }
})

// Capture payment intent
const captured = await stripe.paymentIntents.capture(paymentIntentId)
```

---

## Error Handling

### Standard Error Response
```typescript
{
  error: {
    message: string,
    code?: string,
    details?: any
  }
}
```

### Error Codes
- `AUTH_REQUIRED`: 401 - Not authenticated
- `FORBIDDEN`: 403 - Not authorized
- `NOT_FOUND`: 404 - Resource not found
- `VALIDATION_ERROR`: 400 - Invalid input
- `STRIPE_ERROR`: 500 - Payment processing error
- `SERVER_ERROR`: 500 - Internal server error

### Stripe Error Handling
```typescript
try {
  const paymentIntent = await stripe.paymentIntents.create(...)
} catch (error) {
  if (error.type === 'StripeCardError') {
    return res.status(400).json({
      error: {
        message: 'Your card was declined',
        code: 'CARD_DECLINED'
      }
    })
  }
  // Log error details
  console.error('Stripe error:', error)
  return res.status(500).json({
    error: {
      message: 'Payment processing failed',
      code: 'STRIPE_ERROR'
    }
  })
}
```

---

## Security

### Authentication
- All endpoints require valid JWT token
- Token validated via auth middleware
- User ID extracted from token

### Authorization
- Verify user has permission for action
- Homeowner can only book own jobs
- Provider can only submit quotes for assigned jobs
- Provider can only complete assigned jobs

### Input Validation
```typescript
// Example validation
function validateDiagnosticFee(fee: number): boolean {
  return fee >= 50 && fee <= 150
}

function validateRepairCosts(labor: number, parts: number): boolean {
  return labor >= 0 && parts >= 0 && (labor + parts) > 0
}
```

### Stripe Security
- Use environment variables for API keys
- Never expose secret key to client
- Validate webhook signatures (future)
- Use HTTPS only

---

## Testing Strategy

### Unit Tests
- Test each endpoint with valid inputs
- Test validation logic
- Test error handling
- Mock Stripe API calls

### Integration Tests
- Test complete booking flow
- Test complete repair quote flow
- Test payment capture flow
- Use Stripe test mode

### Property-Based Tests
- Payment calculations are always correct (15% fee)
- Status transitions are valid
- Payment intents are always captured before completion

---

## Performance Considerations

### Database Queries
- Use indexes on frequently queried fields
- Use Prisma connection pooling
- Limit nearby provider search to 5 results

### API Response Times
- Target <500ms for most endpoints
- Target <2s for payment operations
- Use async/await for Stripe calls

### Caching (Future)
- Cache provider profiles (5 min TTL)
- Cache nearby provider results (1 min TTL)
- Invalidate on updates

---

## Monitoring

### Logging
```typescript
// Log all payment operations
console.log('[PAYMENT]', {
  action: 'create_intent',
  jobId,
  amount,
  type: 'diagnostic'
})

// Log all errors
console.error('[ERROR]', {
  endpoint: '/api/bookings',
  error: error.message,
  stack: error.stack
})
```

### Metrics to Track
- Booking success rate
- Payment capture success rate
- Average response times
- Error rates by endpoint
- Stripe API errors

---

## Deployment

### Environment Variables
```bash
# Database
DATABASE_URL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=

# JWT
JWT_SECRET=
JWT_REFRESH_SECRET=

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=

# OpenAI
OPENAI_API_KEY=
```

### Migration Steps
1. Run Prisma migration: `npx prisma migrate deploy`
2. Generate Prisma client: `npx prisma generate`
3. Deploy to Vercel
4. Test with Stripe test mode
5. Switch to Stripe live mode

---

## Future Enhancements (Post-Launch)

### Notifications
- Email notifications (SendGrid)
- SMS notifications (Twilio)
- Push notifications (mobile app)

### Payment Features
- Stripe Connect for provider payouts
- Multiple payment methods
- Refund handling
- Dispute resolution

### Real-time Features
- WebSocket for live updates
- Real-time booking notifications
- Live chat

### Analytics
- Track conversion rates
- Monitor payment success rates
- Provider performance metrics
- Revenue dashboards
