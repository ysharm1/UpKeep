# Launch Checklist: Instant Booking System

## Overview
This is the final implementation needed to launch the UpKeep platform with the instant booking flow. All UI is complete - we just need to wire up the backend.

---

## 🔴 CRITICAL PATH (Must Have for Launch)

### Task 1: Database Schema Updates (30 mins)
**Status:** Not Started

**What to do:**
- [ ] Add `diagnosticFee` field to ServiceProviderProfile (Decimal, optional)
- [ ] Create RepairQuote model with fields:
  - id, jobRequestId, providerId
  - laborCost, partsCost, totalAmount
  - notes, status (PENDING/APPROVED/DECLINED)
  - createdAt, updatedAt
- [ ] Add to JobRequest model:
  - diagnosticPaymentIntentId (String, optional)
  - repairPaymentIntentId (String, optional)
- [ ] Update JobStatus enum to include:
  - diagnostic_scheduled
  - diagnostic_completed
  - repair_pending_approval
  - repair_approved
- [ ] Run Prisma migration

**Files to modify:**
- `prisma/schema.prisma`

**Test:**
```bash
npx prisma migrate dev --name instant_booking
npx prisma generate
```

---

### Task 2: Diagnostic Fee Management (1 hour)
**Status:** Not Started

**What to do:**
- [ ] Create `PUT /api/providers/[id]/diagnostic-fee` endpoint
  - Accept diagnosticFee in body
  - Validate fee is positive number
  - Update ServiceProviderProfile
  - Return updated profile
- [ ] Update provider settings page to call this endpoint

**Files to create/modify:**
- `app/api/providers/[id]/diagnostic-fee/route.ts` (new)
- `app/provider/settings/page.tsx` (wire up API call)

**Test:**
- Set diagnostic fee to $89
- Verify it saves to database
- Verify it displays on provider profile

---

### Task 3: Instant Booking Endpoint (2 hours)
**Status:** Not Started

**What to do:**
- [ ] Create `POST /api/bookings` endpoint
  - Accept: jobRequestId, providerId
  - Get provider's diagnosticFee from database
  - Create Stripe PaymentIntent with:
    - amount: diagnosticFee * 100 (convert to cents)
    - capture_method: 'manual'
    - metadata: { jobRequestId, providerId, type: 'diagnostic' }
  - Store paymentIntentId in JobRequest.diagnosticPaymentIntentId
  - Update job status to 'diagnostic_scheduled'
  - Return booking confirmation

**Files to create:**
- `app/api/bookings/route.ts`

**Test:**
- Book diagnostic visit
- Check Stripe dashboard for authorized payment
- Verify job status updated
- Verify payment NOT captured yet

---

### Task 4: Repair Quote Submission (1.5 hours)
**Status:** Not Started

**What to do:**
- [ ] Create `POST /api/jobs/[id]/repair-quote` endpoint
  - Accept: laborCost, partsCost, notes
  - Calculate totalAmount = laborCost + partsCost
  - Create RepairQuote record with status PENDING
  - Update job status to 'repair_pending_approval'
  - Send notification to homeowner (email/SMS)
  - Return created quote

**Files to create:**
- `app/api/jobs/[id]/repair-quote/route.ts`

**Test:**
- Submit repair quote from provider dashboard
- Verify quote saved to database
- Verify homeowner receives notification

---

### Task 5: Repair Quote Approval (2 hours)
**Status:** Not Started

**What to do:**
- [ ] Create `POST /api/jobs/[id]/approve-repair` endpoint
  - Get RepairQuote for job
  - Create second Stripe PaymentIntent for repair amount:
    - amount: repairQuote.totalAmount * 100
    - capture_method: 'manual'
    - metadata: { jobRequestId, quoteId, type: 'repair' }
  - Store paymentIntentId in JobRequest.repairPaymentIntentId
  - Update RepairQuote status to APPROVED
  - Update job status to 'repair_approved'
  - Send notification to provider
  - Return approval confirmation

**Files to create:**
- `app/api/jobs/[id]/approve-repair/route.ts`

**Test:**
- Approve repair quote
- Check Stripe dashboard for second authorized payment
- Verify both payments authorized but NOT captured

---

### Task 6: Job Completion & Payment Capture (2 hours)
**Status:** Not Started

**What to do:**
- [ ] Create `POST /api/jobs/[id]/complete` endpoint
  - Verify provider is authorized
  - Get both payment intent IDs from JobRequest
  - Capture diagnostic payment intent
  - Capture repair payment intent
  - Calculate totals:
    - totalAmount = diagnostic + repair
    - platformFee = totalAmount * 0.15
    - providerPayout = totalAmount * 0.85
  - Update job status to 'completed'
  - Create Payment record with all amounts
  - Send notifications to both parties
  - Return completion confirmation

**Files to create:**
- `app/api/jobs/[id]/complete/route.ts`

**Test:**
- Mark job complete
- Verify both payments captured in Stripe
- Verify Payment record created with correct fee split
- Verify job status = completed

---

### Task 7: Provider Nearby Search (1 hour)
**Status:** Not Started

**What to do:**
- [ ] Create `GET /api/providers/nearby` endpoint
  - Accept: lat, lng, category
  - Query providers with matching specialty
  - Calculate distance from job location
  - Filter by service area (if configured)
  - Sort by distance
  - Return top 5 providers with diagnosticFee

**Files to create:**
- `app/api/providers/nearby/route.ts`

**Test:**
- Search for providers near SF
- Verify correct providers returned
- Verify diagnostic fees included

---

### Task 8: Wire Up UI to Backend (2 hours)
**Status:** Not Started

**What to do:**
- [ ] Update `/problems/[id]/professionals` page:
  - Call `/api/providers/nearby` to get real providers
  - Wire "Book Diagnostic Visit" button to `/api/bookings`
- [ ] Update `/provider/dashboard` page:
  - Fetch real bookings from database
  - Wire "Submit Repair Quote" button to repair-quote page
- [ ] Update `/provider/jobs/[id]/repair-quote` page:
  - Wire form submission to `/api/jobs/[id]/repair-quote`
- [ ] Add homeowner repair quote approval page:
  - Create `/app/jobs/[id]/approve-repair/page.tsx`
  - Show quote details
  - Wire "Approve" button to `/api/jobs/[id]/approve-repair`
- [ ] Wire "Mark Complete" button to `/api/jobs/[id]/complete`

**Files to modify:**
- `app/problems/[id]/professionals/page.tsx`
- `app/provider/dashboard/page.tsx`
- `app/provider/jobs/[id]/repair-quote/page.tsx`
- `app/jobs/[id]/approve-repair/page.tsx` (new)

**Test:**
- Complete full flow end-to-end
- Book → Quote → Approve → Complete
- Verify all payments work

---

## 🟡 IMPORTANT (Should Have for Launch)

### Task 9: Error Handling & Validation (1 hour)
- [ ] Add try-catch blocks to all API routes
- [ ] Return proper error messages
- [ ] Validate all inputs
- [ ] Handle Stripe errors gracefully

### Task 10: Notifications (2 hours)
- [ ] Set up SendGrid or Twilio
- [ ] Send email when booking confirmed
- [ ] Send email when repair quote submitted
- [ ] Send email when repair approved
- [ ] Send email when job completed

### Task 11: Loading States (1 hour)
- [ ] Add loading spinners to all buttons
- [ ] Add skeleton screens for data loading
- [ ] Disable buttons during API calls

### Task 12: Mobile Responsive Polish (2 hours)
- [ ] Test all pages on iPhone Safari
- [ ] Test all pages on Android Chrome
- [ ] Fix any layout issues
- [ ] Ensure buttons are touch-friendly

---

## 🟢 NICE TO HAVE (Post-Launch)

### Task 13: Real-time Updates
- [ ] Add WebSocket for live booking notifications
- [ ] Add push notifications

### Task 14: Analytics
- [ ] Add Plausible or PostHog
- [ ] Track key events (bookings, completions)

### Task 15: Admin Dashboard
- [ ] View all bookings
- [ ] Manage providers
- [ ] View revenue

---

## 📊 Estimated Timeline

**Critical Path (Tasks 1-8):** 12 hours = 1.5-2 days
**Important (Tasks 9-12):** 6 hours = 1 day
**Total to Launch:** 18 hours = 2-3 days of focused work

---

## ✅ Definition of Done

**You can launch when:**
- [ ] Homeowner can book diagnostic visit and payment is authorized
- [ ] Provider receives booking notification
- [ ] Provider can submit repair quote
- [ ] Homeowner can approve repair quote and payment is authorized
- [ ] Provider can mark job complete and both payments are captured
- [ ] Platform receives 15% fee, provider receives 85%
- [ ] All pages work on mobile
- [ ] Error messages are user-friendly
- [ ] Tested end-to-end with real Stripe test mode

---

## 🚀 Launch Sequence

**Day 1:**
- Morning: Tasks 1-3 (Database + Booking)
- Afternoon: Tasks 4-5 (Repair Quote)

**Day 2:**
- Morning: Tasks 6-7 (Completion + Search)
- Afternoon: Task 8 (Wire up UI)

**Day 3:**
- Morning: Tasks 9-12 (Polish)
- Afternoon: End-to-end testing

**Day 4:**
- Deploy to production
- Test with real users

---

## 🎯 Success Metrics

**Week 1:**
- 5 providers onboarded
- 10 diagnostic bookings
- 5 completed jobs

**Month 1:**
- 20 providers
- 50 bookings
- $2,000 GMV (Gross Merchandise Value)
- $300 platform revenue (15%)

---

## 📝 Notes

- Use Stripe test mode for all development
- Test with test credit cards: 4242 4242 4242 4242
- Don't capture payments until job is complete
- Always calculate 15% platform fee
- Store all payment intent IDs for audit trail

