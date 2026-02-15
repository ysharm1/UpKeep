# Quick Test Guide - 30 Minutes

Test the complete UpKeep platform in 30 minutes.

---

## Setup (5 minutes)

```bash
# 1. Install dependencies (if not done)
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# 3. Set up database
npx prisma generate
npx prisma migrate dev

# 4. Start dev server
npm run dev
```

Visit: http://localhost:3000

---

## Test 1: Homeowner Registration (2 min)

1. Go to http://localhost:3000/auth/register
2. Select "Homeowner"
3. Enter email: `test@homeowner.com`
4. Enter password: `password123`
5. Click "Register"
6. Should redirect to `/dashboard`

✅ **Pass**: Logged in and see dashboard

---

## Test 2: Submit Problem with Photo (3 min)

1. Click "Submit New Problem" or go to `/problems/new`
2. Select category: "HVAC"
3. Enter description: "My AC is not cooling properly. It's been running but the air coming out is warm."
4. Enter location:
   - Street: "123 Main St"
   - City: "San Francisco"
   - State: "CA"
   - ZIP: "94102"
5. **Upload a photo**:
   - Click or drag & drop an image
   - Wait for upload to complete
   - See preview
6. Click "Try AI First"
7. Wait for AI diagnosis

✅ **Pass**: Problem submitted, AI diagnosis shown, photo uploaded

---

## Test 3: Find Professionals (2 min)

1. From AI diagnosis page, click "I Need Professional Help"
2. Should see list of nearby providers
3. Each provider shows:
   - Business name
   - Rating and reviews
   - Distance
   - Diagnostic fee
   - "Book Diagnostic Visit" button

✅ **Pass**: Providers list displayed

---

## Test 4: Book with Scheduling & Payment (5 min)

1. Click "Book Diagnostic Visit" on any provider
2. **Modal opens - Step 1: Schedule**
   - See next 7 days
   - Click a date (e.g., tomorrow)
   - See time slots (8 AM - 6 PM)
   - Click a time (e.g., 2:00 PM)
   - See confirmation: "Appointment scheduled for..."
3. Click "Continue to Payment"
4. **Modal Step 2: Payment**
   - See appointment summary
   - See Stripe payment form
   - Enter test card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
5. Click "Authorize $89" (or whatever the fee is)
6. Wait for processing
7. Should see success message
8. Redirected to job details page

✅ **Pass**: Booking completed with scheduled time and payment

---

## Test 5: View Job Details (1 min)

1. On job details page, verify:
   - Job status: "Diagnostic Scheduled"
   - Provider name shown
   - **Scheduled appointment time shown**
   - Progress bar showing current step
   - Provider contact info

✅ **Pass**: Job details complete with scheduled time

---

## Test 6: Provider Registration (2 min)

1. Logout (if needed)
2. Go to `/auth/register`
3. Select "Service Provider"
4. Enter email: `test@provider.com`
5. Enter password: `password123`
6. Click "Register"
7. Should redirect to `/provider/dashboard`

✅ **Pass**: Provider registered and logged in

---

## Test 7: Set Diagnostic Fee (1 min)

1. Go to `/provider/settings`
2. Enter diagnostic fee: `89`
3. Click "Save"
4. See success message

✅ **Pass**: Diagnostic fee saved

---

## Test 8: View Booking (1 min)

1. Go to `/provider/dashboard`
2. Should see the booking from Test 4
3. Verify:
   - Homeowner name
   - Job description
   - Status: "Diagnostic Scheduled"
   - **Scheduled time shown** (if implemented)

✅ **Pass**: Booking visible on provider dashboard

---

## Test 9: Submit Diagnostic Report with Photos (3 min)

1. Click on the job
2. Click "Submit Diagnostic Report" or go to `/provider/jobs/[id]/diagnostic-report`
3. Enter findings: "AC compressor is failing. Needs replacement."
4. **Upload photos**:
   - Click or drag & drop images
   - Wait for upload
   - See previews
5. Enter recommendations: "Replace compressor unit. Estimated 2-3 hours labor."
6. Click "Submit Report"
7. See success message

✅ **Pass**: Diagnostic report submitted with photos

---

## Test 10: Capture Diagnostic Payment (1 min)

1. On job details page
2. Click "Capture Diagnostic Payment"
3. Confirm
4. See success message
5. Status updates to "Diagnostic Completed"

✅ **Pass**: Payment captured

---

## Test 11: Submit Repair Quote (2 min)

1. Click "Submit Repair Quote" or go to `/provider/jobs/[id]/repair-quote`
2. Enter:
   - Labor cost: `200`
   - Parts cost: `120`
   - Notes: "Includes new compressor unit and installation"
3. See total: `$320`
4. Click "Submit Quote"
5. See success message

✅ **Pass**: Repair quote submitted

---

## Test 12: Approve Repair with Payment (3 min)

1. Logout and login as homeowner (`test@homeowner.com`)
2. Go to dashboard
3. Click on the job
4. Click "Approve Repair Quote" or go to `/jobs/[id]/approve-repair`
5. Review quote breakdown
6. Click "Approve & Authorize Payment"
7. **Payment form appears**:
   - Enter test card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
8. Click "Approve & Authorize $320"
9. Wait for processing
10. See success message
11. Redirected to job details

✅ **Pass**: Repair approved with payment

---

## Test 13: Complete Job (1 min)

1. Logout and login as provider (`test@provider.com`)
2. Go to dashboard
3. Click on the job
4. Click "Complete Job"
5. Confirm
6. See success message
7. Status updates to "Completed"

✅ **Pass**: Job completed, payment captured

---

## Test 14: Verify Stripe Dashboard (2 min)

1. Go to https://dashboard.stripe.com/test/payments
2. Verify two payments:
   - Diagnostic fee ($89) - Captured
   - Repair fee ($320) - Captured
3. Check payment details:
   - Metadata includes job ID
   - Amounts are correct

✅ **Pass**: Payments visible in Stripe

---

## Test 15: Check Email Logs (1 min)

1. Check terminal/console logs
2. Look for email notifications:
   - Booking confirmation (to provider)
   - Diagnostic report ready (to homeowner)
   - Repair quote ready (to homeowner)
   - Quote approved (to provider)
   - Job completed (to both)

✅ **Pass**: Email logs show notifications sent

---

## 🎉 All Tests Passed?

If all 15 tests passed, your platform is working correctly!

### What You Tested:
- ✅ User registration (both roles)
- ✅ Photo upload (real cloud storage)
- ✅ AI diagnosis
- ✅ Provider search
- ✅ Appointment scheduling
- ✅ Stripe payment processing
- ✅ Email notifications
- ✅ Complete job workflow
- ✅ Payment capture
- ✅ Status updates

### Ready for:
- Beta testing with real users
- Production deployment
- First real bookings

---

## 🐛 Common Issues

### Photo Upload Fails
- Check AWS credentials in `.env.local`
- Check S3 bucket exists and is accessible
- Check CORS settings on S3 bucket

### Stripe Payment Fails
- Check Stripe keys in `.env.local`
- Use test mode keys (sk_test_...)
- Verify test card number is correct

### Email Not Sending
- Check Resend API key in `.env.local`
- Check console logs for email content
- In development, emails are logged, not sent

### Database Errors
- Run `npx prisma generate`
- Run `npx prisma migrate dev`
- Check DATABASE_URL is correct

---

## 📞 Need Help?

1. Check error logs in terminal
2. Check browser console for errors
3. Review CRITICAL_FIXES_COMPLETED.md
4. Review LAUNCH_READY_FINAL.md

---

**Time to complete**: 30 minutes  
**Tests**: 15  
**Pass rate needed**: 100%

**Good luck! 🚀**

