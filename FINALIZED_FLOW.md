# UpKeep Platform - Finalized Instant Booking Flow

## Overview
Fast, Uber-like booking system for home repair diagnostic visits with on-site repair quotes.

---

## Complete User Flow

### Homeowner Journey

1. **Submit Problem** (`/problems/new`)
   - Describe issue
   - Upload photo (optional)
   - Choose urgency (ASAP / Today / Flexible)
   - AI categorizes and suggests DIY solutions

2. **Book Diagnostic Visit** (`/problems/[id]/professionals`)
   - See 3 nearby providers with:
     * Rating & reviews
     * Diagnostic fee ($75-95)
     * Availability
     * Distance
     * Typical repair range (confidence anchor)
   - Click "Book Diagnostic Visit - $89"
   - Payment authorized (NOT captured)

3. **Provider Visits**
   - Provider arrives at scheduled time
   - Diagnoses problem on-site
   - Submits repair quote through app

4. **Approve Repair Quote** (notification in app)
   - See breakdown: Diagnostic $89 + Repair $320 = $409
   - Click "Approve & Proceed"
   - Repair payment authorized

5. **Work Completed**
   - Provider marks job complete
   - Both payments captured
   - Provider receives 85% ($347.65)
   - Platform keeps 15% ($61.35)

---

### Provider Journey

1. **Set Diagnostic Fee** (`/provider/settings`)
   - One-time setup
   - Set fee: $50-150
   - Displayed to homeowners

2. **Receive Bookings** (`/provider/dashboard`)
   - See incoming diagnostic bookings
   - Payment already authorized
   - View customer info, location, scheduled time
   - Click "Get Directions"

3. **Visit & Diagnose**
   - Arrive at customer location
   - Inspect problem
   - Click "Submit Repair Quote"

4. **Submit Repair Quote** (`/provider/jobs/[id]/repair-quote`)
   - Enter labor cost
   - Enter parts cost
   - Add notes (optional)
   - See total: Diagnostic + Repair
   - Submit to homeowner

5. **Complete Work**
   - Homeowner approves quote
   - Perform repair
   - Click "Mark as Complete"
   - Receive payment (85% of total)

---

## Payment Flow

### Two Separate Payment Intents

**Diagnostic Payment:**
- Created when homeowner books
- Amount: $89
- Status: `authorized` (not captured)
- Captured when: Job marked complete

**Repair Payment:**
- Created when homeowner approves repair quote
- Amount: $320
- Status: `authorized` (not captured)
- Captured when: Job marked complete

**On Completion:**
- Capture both payment intents
- Total: $409
- Provider receives: $347.65 (85%)
- Platform fee: $61.35 (15%)

---

## Database Schema Updates Needed

### New Fields in ServiceProviderProfile:
```prisma
diagnosticFee  Decimal  @db.Decimal(10, 2)
```

### New Model: RepairQuote
```prisma
model RepairQuote {
  id            String   @id @default(cuid())
  jobRequestId  String   @unique
  providerId    String
  laborCost     Decimal  @db.Decimal(10, 2)
  partsCost     Decimal  @db.Decimal(10, 2)
  totalAmount   Decimal  @db.Decimal(10, 2)
  notes         String?  @db.Text
  status        QuoteStatus @default(PENDING)
  createdAt     DateTime @default(now())
  
  jobRequest    JobRequest @relation(fields: [jobRequestId], references: [id])
}

enum QuoteStatus {
  PENDING
  APPROVED
  DECLINED
}
```

### Update JobRequest:
```prisma
diagnosticPaymentIntentId  String?
repairPaymentIntentId      String?
status                     JobStatus
```

### New JobStatus Values:
```prisma
enum JobStatus {
  submitted
  ai_diagnosis
  resolved_diy
  diagnostic_scheduled    // NEW
  diagnostic_completed    // NEW
  repair_pending_approval // NEW
  repair_approved         // NEW
  in_progress
  completed
  cancelled
}
```

---

## API Endpoints Needed

### Provider Endpoints:
- `PUT /api/providers/[id]/diagnostic-fee` - Set diagnostic fee
- `GET /api/providers/nearby?lat=&lng=&category=` - Find nearby providers
- `POST /api/bookings` - Book diagnostic visit
- `POST /api/jobs/[id]/repair-quote` - Submit repair quote

### Homeowner Endpoints:
- `GET /api/jobs/[id]/repair-quote` - View repair quote
- `POST /api/jobs/[id]/approve-repair` - Approve repair quote
- `POST /api/jobs/[id]/decline-repair` - Decline repair quote

### Payment Endpoints:
- `POST /api/payments/authorize-diagnostic` - Authorize diagnostic payment
- `POST /api/payments/authorize-repair` - Authorize repair payment
- `POST /api/payments/capture` - Capture both payments on completion

---

## Files Structure

### Working Pages:
✅ `/app/problems/new/page.tsx` - Problem submission
✅ `/app/problems/[id]/chat/page.tsx` - AI chat
✅ `/app/problems/[id]/professionals/page.tsx` - Instant booking
✅ `/app/provider/dashboard/page.tsx` - Provider dashboard
✅ `/app/provider/settings/page.tsx` - Diagnostic fee settings
✅ `/app/provider/jobs/[id]/repair-quote/page.tsx` - Repair quote form
✅ `/app/dashboard/page.tsx` - Homeowner dashboard
✅ `/app/demo/page.tsx` - Demo guide

### Deleted (Not Needed):
❌ `/app/provider/jobs/available/page.tsx` - No job browsing needed
❌ `/app/provider/jobs/[id]/quote/page.tsx` - Replaced by repair-quote

---

## Key Differences from Original Design

### What Changed:
1. **No quote comparison** - Instant booking instead
2. **Diagnostic fee only upfront** - Repair quote after inspection
3. **Two payment intents** - Separate for diagnostic and repair
4. **Simpler provider settings** - Just diagnostic fee, no base rates
5. **No job browsing** - Providers receive bookings automatically

### Why It's Better:
- **Faster** - Homeowners book instantly, no waiting for quotes
- **More accurate** - Providers quote after seeing the problem
- **Lower risk** - Small diagnostic fee upfront, not full job cost
- **Real-world** - Matches how HVAC/plumbing actually works
- **Simpler** - Less complexity, fewer steps

---

## Next Steps for Backend Implementation

### Priority 1: Booking Flow
1. Add `diagnosticFee` to ServiceProviderProfile
2. Create `/api/bookings` endpoint
3. Integrate Stripe payment intent (authorize only)
4. Update job status to `diagnostic_scheduled`

### Priority 2: Repair Quote Flow
1. Create RepairQuote model
2. Create `/api/jobs/[id]/repair-quote` endpoint
3. Create `/api/jobs/[id]/approve-repair` endpoint
4. Create second payment intent for repair

### Priority 3: Payment Capture
1. Create `/api/payments/capture` endpoint
2. Capture both payment intents
3. Calculate 15% platform fee
4. Transfer 85% to provider (Stripe Connect)

### Priority 4: Notifications
1. Notify homeowner when repair quote submitted
2. Notify provider when repair approved
3. Notify both when job completed

---

## Testing Checklist

### Homeowner Flow:
- [ ] Submit problem
- [ ] See AI diagnosis
- [ ] View providers with diagnostic fees
- [ ] Book diagnostic visit
- [ ] Payment authorized (check Stripe dashboard)
- [ ] Receive repair quote notification
- [ ] Approve repair quote
- [ ] Second payment authorized
- [ ] Job marked complete
- [ ] Both payments captured

### Provider Flow:
- [ ] Set diagnostic fee in settings
- [ ] See incoming booking in dashboard
- [ ] View customer details
- [ ] Submit repair quote
- [ ] See quote status (pending/approved)
- [ ] Mark job complete
- [ ] Receive payment (85%)

---

## Demo URLs

- **Start here:** http://localhost:3000/demo
- **Homeowner booking:** http://localhost:3000/problems/1/professionals
- **Provider dashboard:** http://localhost:3000/provider/dashboard
- **Provider settings:** http://localhost:3000/provider/settings
- **Repair quote form:** http://localhost:3000/provider/jobs/1/repair-quote

---

## Success Metrics

### Speed:
- Homeowner books in < 2 minutes
- Provider receives booking instantly
- Repair quote submitted on-site (< 5 minutes)

### Conversion:
- Diagnostic booking rate: Target 60%+
- Repair approval rate: Target 70%+
- Job completion rate: Target 90%+

### Revenue:
- Average diagnostic fee: $75-95
- Average repair: $200-600
- Average total: $275-695
- Platform revenue (15%): $41-104 per job

