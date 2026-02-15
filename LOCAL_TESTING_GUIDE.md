# Local Testing Guide - UpKeep Platform

**Time Required:** 30-60 minutes  
**Goal:** Test complete homeowner and provider flows locally

---

## Prerequisites Checklist

Before testing, ensure you have:

- [ ] Node.js installed (v18+)
- [ ] PostgreSQL database running
- [ ] Stripe test account (get keys from dashboard.stripe.com)
- [ ] OpenAI API key (optional for AI features)
- [ ] AWS S3 bucket OR local file storage setup

---

## Step 1: Environment Setup (10 minutes)

### 1.1 Check Your .env File

Your current `.env` needs these keys filled in:

```bash
# Required for testing
DATABASE_URL="postgresql://user:password@localhost:5432/upkeep?schema=public"
JWT_SECRET="dev-secret-key-change-in-production"
JWT_REFRESH_SECRET="dev-refresh-secret-key-change-in-production"

# Stripe (REQUIRED for payment testing)
STRIPE_SECRET_KEY="sk_test_..." # Get from dashboard.stripe.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..." # Get from dashboard.stripe.com

# OpenAI (Optional - AI diagnosis will fail gracefully without it)
OPENAI_API_KEY="sk-..." # Get from platform.openai.com

# AWS S3 (Optional - can test without photo upload)
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
AWS_S3_BUCKET="upkeep-dev"

# Email (Optional - will log to console without it)
RESEND_API_KEY="re_..." # Get from resend.com
EMAIL_FROM="noreply@yourdomain.com"
```

### 1.2 Get Stripe Test Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy "Publishable key" → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Copy "Secret key" → `STRIPE_SECRET_KEY`

**These are REQUIRED for testing payments.**

### 1.3 Database Setup

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# (Optional) Seed test data
npx prisma db seed
```

---

## Step 2: Start Development Server (2 minutes)

```bash
# Start the Next.js development server
npm run dev
```

Server should start at: http://localhost:3000

**Keep this terminal open!**

---

## Step 3: Homeowner Flow Testing (15 minutes)

### 3.1 Register as Homeowner

1. Open http://localhost:3000
2. Click "Sign Up"
3. Select "Homeowner" role
4. Fill in:
   - Email: `test-homeowner@example.com`
   - Password: `password123`
   - First Name: `John`
   - Last Name: `Doe`
   - Phone: `555-0100`
5. Click "Register"

**Expected:** Redirect to `/dashboard`

### 3.2 Submit a Problem

1. Click "Get Help with a Problem"
2. Fill in problem details:
   - Category: `HVAC`
   - Description: `My air conditioner is making a loud grinding noise and not cooling properly. Started yesterday.`
   - Location:
     - Street: `123 Main St`
     - City: `San Francisco`
     - State: `CA`
     - ZIP: `94102`
3. (Optional) Upload a photo if AWS S3 is configured
4. Click "Try AI First"

**Expected:** 
- AI diagnosis screen appears
- DIY steps shown (if OpenAI configured)
- Chat interface available

### 3.3 Skip to Professional Help

1. Click "→ I Need Professional Help"

**Expected:** Redirect to professionals page

### 3.4 Book a Diagnostic Visit

**Note:** This requires at least one provider to be registered. See Provider Flow first, then come back here.

1. View available providers
2. Click "Book Diagnostic Visit" on any provider
3. **Booking Modal Step 1: Schedule**
   - Select a date (today or tomorrow)
   - Select a time slot
   - Click "Continue to Payment →"
4. **Booking Modal Step 2: Payment**
   - Enter Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
   - Click "Authorize $XX"

**Expected:**
- Success message
- Redirect to job details page
- Scheduled appointment time visible
- Status: "diagnostic_scheduled"

**Check Stripe Dashboard:**
- Go to https://dashboard.stripe.com/test/payments
- You should see a payment with status "Uncaptured"

### 3.5 View Job Details

1. Go to Dashboard
2. Click on your job
3. Verify:
   - Progress bar shows "Provider Assigned"
   - Scheduled appointment visible
   - Provider info displayed

---

## Step 4: Provider Flow Testing (15 minutes)

### 4.1 Register as Provider

**Open a new incognito/private window** (to avoid logout)

1. Go to http://localhost:3000
2. Click "Sign Up"
3. Select "Service Provider" role
4. Fill in:
   - Email: `test-provider@example.com`
   - Password: `password123`
   - Business Name: `Quick Fix HVAC`
   - First Name: `Mike`
   - Last Name: `Smith`
   - Phone: `555-0200`
   - Specialties: `HVAC, Plumbing`
5. Click "Register"

**Expected:** Redirect to `/provider/dashboard`

### 4.2 Set Diagnostic Fee

1. Go to Settings (if available) or use database directly:

```bash
# In a new terminal
npx prisma studio
```

2. Find your provider in `ServiceProviderProfile` table
3. Set `diagnosticFee` to `89`
4. Save

### 4.3 View Scheduled Booking

1. Refresh provider dashboard
2. You should see the booking from homeowner
3. Verify:
   - Homeowner name and contact info
   - Problem description
   - Location
   - Diagnostic fee: $89
   - Status: "✓ Authorized"

### 4.4 Submit Diagnostic Report

1. Click "Submit Assessment"
2. Fill in findings:
   - Diagnosis: `Compressor bearing failure. Needs replacement.`
   - Labor Cost: `200`
   - Parts Cost: `120`
   - Notes: `Compressor is worn out. Recommend replacement to avoid further damage.`
3. (Optional) Upload photos if AWS S3 configured
4. Click "Submit Report"

**Expected:**
- Success message
- Job status changes to "diagnostic_completed"

### 4.5 Capture Diagnostic Payment

1. Back on provider dashboard
2. Find the job (should still be in "Scheduled Visits" or move to different section)
3. Click "Capture Diagnostic Payment"
4. Confirm

**Expected:**
- Success message
- Payment captured in Stripe

**Check Stripe Dashboard:**
- Payment status should change from "Uncaptured" to "Succeeded"
- Amount: $89

### 4.6 Wait for Homeowner to Approve Quote

Switch back to homeowner window...

---

## Step 5: Repair Quote Approval (10 minutes)

### 5.1 View Repair Quote (Homeowner)

1. Go to homeowner dashboard
2. Click on the job
3. Click "Review Repair Quote"
4. Verify quote breakdown:
   - Labor: $200
   - Parts: $120
   - Repair Subtotal: $320
   - Diagnostic Fee: $89
   - Total: $409

### 5.2 Approve Quote

1. Click "Approve & Authorize Payment"
2. Enter Stripe test card again:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
   - ZIP: `12345`
3. Click "Approve & Authorize $320"

**Expected:**
- Success message
- Redirect to job details
- Status: "repair_approved"

**Check Stripe Dashboard:**
- New payment authorization for $320
- Status: "Uncaptured"

---

## Step 6: Job Completion (5 minutes)

### 6.1 Complete Job (Provider)

1. Switch to provider window
2. Refresh dashboard
3. Job should now be in "Active Jobs" section
4. Click "Mark as Complete"
5. Confirm

**Expected:**
- Success message
- Payment captured
- Provider receives 85% of total

**Check Stripe Dashboard:**
- Repair payment status: "Succeeded"
- Amount: $320

### 6.2 Verify Completion (Homeowner)

1. Switch to homeowner window
2. Refresh dashboard
3. Job status should be "completed"
4. Progress bar shows all steps complete

---

## Step 7: Admin Dashboard Testing (5 minutes)

### 7.1 Access Admin Dashboard

1. Go to http://localhost:3000/admin
2. You should see:
   - Daily operations metrics
   - All jobs listed
   - Filter options

### 7.2 Test Admin Actions

1. Click on a job
2. Try these actions:
   - **Change Status** - Select different status from dropdown
   - **View Details** - See full job information
   - **Capture Payment** - Force capture (if any uncaptured)
   - **Issue Refund** - Test refund flow

**Expected:** All actions work without errors

---

## Stripe Test Cards Reference

### Success Cases
- **Basic success:** `4242 4242 4242 4242`
- **3D Secure required:** `4000 0025 0000 3155`

### Failure Cases
- **Card declined:** `4000 0000 0000 0002`
- **Insufficient funds:** `4000 0000 0000 9995`
- **Expired card:** `4000 0000 0000 0069`

### All Cards
- **Expiry:** Any future date
- **CVC:** Any 3 digits
- **ZIP:** Any 5 digits

---

## Common Issues & Solutions

### Issue: "Failed to fetch providers"
**Solution:** You need at least one provider registered with a diagnostic fee set.

### Issue: "Stripe is not defined"
**Solution:** 
1. Check `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env`
2. Restart dev server: `npm run dev`

### Issue: "Payment authorization failed"
**Solution:**
1. Check `STRIPE_SECRET_KEY` in `.env`
2. Verify you're using test keys (start with `sk_test_` and `pk_test_`)
3. Check Stripe dashboard for error details

### Issue: "Photo upload failed"
**Solution:** 
- AWS S3 not configured - this is optional for testing
- Skip photo upload or configure AWS credentials

### Issue: "AI diagnosis not working"
**Solution:**
- OpenAI API key not configured - this is optional
- AI will fail gracefully and show fallback message

### Issue: Database connection error
**Solution:**
```bash
# Check if PostgreSQL is running
psql -U user -d upkeep

# If not, start PostgreSQL
# macOS: brew services start postgresql
# Linux: sudo service postgresql start
```

---

## Testing Checklist

### Homeowner Flow
- [ ] Register as homeowner
- [ ] Submit problem with description
- [ ] View AI diagnosis (if OpenAI configured)
- [ ] Find professionals
- [ ] Book diagnostic visit with scheduling
- [ ] Enter payment information
- [ ] Payment authorized (check Stripe)
- [ ] View job details with scheduled time
- [ ] View diagnostic report from provider
- [ ] Review repair quote
- [ ] Approve repair quote with payment
- [ ] Repair payment authorized (check Stripe)
- [ ] View completed job

### Provider Flow
- [ ] Register as provider
- [ ] Set diagnostic fee
- [ ] View scheduled booking
- [ ] See homeowner contact info
- [ ] Submit diagnostic report
- [ ] Capture diagnostic payment
- [ ] Payment captured in Stripe
- [ ] View approved repair quote
- [ ] Complete job
- [ ] Repair payment captured in Stripe

### Payment Verification
- [ ] Diagnostic payment authorized (not captured)
- [ ] Diagnostic payment captured after visit
- [ ] Repair payment authorized on approval
- [ ] Repair payment captured on completion
- [ ] Correct amounts in Stripe dashboard
- [ ] No double captures

### Admin Dashboard
- [ ] View all jobs
- [ ] Filter by status
- [ ] Change job status manually
- [ ] Capture payments manually
- [ ] Issue refunds
- [ ] Force complete jobs

---

## Next Steps After Testing

### If Everything Works:
1. ✅ Review VERCEL_DEPLOYMENT.md
2. ✅ Deploy to production
3. ✅ Onboard 3-5 beta providers
4. ✅ Launch beta

### If Issues Found:
1. Document the issue
2. Check browser console for errors
3. Check terminal for server errors
4. Fix critical blockers
5. Re-test

---

## Quick Test Script (5 minutes)

If you just want to verify the core flow works:

```bash
# 1. Start server
npm run dev

# 2. Register homeowner at /auth/register
# 3. Register provider at /auth/register (incognito window)
# 4. Set provider diagnostic fee in Prisma Studio
# 5. Homeowner: Submit problem → Book provider
# 6. Enter test card: 4242 4242 4242 4242
# 7. Check Stripe dashboard for authorization
# 8. Provider: Submit report → Capture diagnostic
# 9. Homeowner: Approve quote with test card
# 10. Provider: Complete job
# 11. Check Stripe dashboard for both captures
```

**If all 11 steps work → You're ready to deploy! 🚀**

---

## Support

If you encounter issues:
1. Check browser console (F12)
2. Check terminal for server errors
3. Check Stripe dashboard for payment details
4. Review error messages carefully

**Most common issue:** Missing Stripe keys in `.env` file.

**Good luck with testing! 🎉**
