# 🧪 PRE-LAUNCH TESTING CHECKLIST

**Purpose**: Verify every critical user flow works before launch
**Time Required**: 30-45 minutes
**Test Environment**: https://up-keep-9zbu.vercel.app

---

## 🏠 HOMEOWNER FLOW

### Test 1: Registration & Login
- [ ] Go to https://up-keep-9zbu.vercel.app
- [ ] Click "Sign Up" or "Register"
- [ ] Register as homeowner with NEW email
- [ ] Verify you're redirected to dashboard
- [ ] Log out
- [ ] Log back in with same credentials
- [ ] Verify you see dashboard again

**Expected**: Smooth registration, login works, dashboard loads

---

### Test 2: Create Job Request (AI Path)
- [ ] Click "Get Help with a Problem"
- [ ] Select category: HVAC
- [ ] Enter description: "My AC is blowing hot air and making loud noises"
- [ ] Fill in address (use real address for testing)
- [ ] Click "Try AI First"
- [ ] Verify AI diagnosis appears
- [ ] Try asking a follow-up question in chat
- [ ] Verify AI responds

**Expected**: Job created, AI diagnosis works, chat works

---

### Test 3: Hire Professional Path
- [ ] From AI diagnosis page, click "I Need Professional Help"
- [ ] Verify you see list of providers (or "no providers" message)
- [ ] If providers shown, try to schedule consultation
- [ ] Verify date/time selection works

**Expected**: Provider listing works, scheduling UI works

---

### Test 4: View Jobs on Dashboard
- [ ] Go back to dashboard
- [ ] Verify your job appears in "Active" tab
- [ ] Check job status is correct
- [ ] Click "View Details" on the job
- [ ] Verify job details page loads

**Expected**: Dashboard shows jobs, details page works

---

## 🔧 PROVIDER FLOW

### Test 5: Provider Registration
- [ ] Open incognito/private window
- [ ] Go to https://up-keep-9zbu.vercel.app
- [ ] Register as SERVICE PROVIDER with NEW email
- [ ] Fill in business name, license, etc.
- [ ] Verify redirected to provider dashboard
- [ ] Check dashboard shows "Available Jobs"

**Expected**: Provider registration works, sees provider dashboard

---

### Test 6: Claim a Job
- [ ] On provider dashboard, find available jobs
- [ ] Click "Claim Job" on one
- [ ] Confirm the claim
- [ ] Verify job moves to "Your Jobs" section
- [ ] Verify status shows "Claimed - Awaiting Booking"

**Expected**: Job claiming works, job appears in provider's list

---

### Test 7: Messaging System
- [ ] From provider dashboard, click "Message Homeowner"
- [ ] Send a test message
- [ ] Switch back to homeowner account (other browser)
- [ ] Go to Messages
- [ ] Verify you see the message
- [ ] Reply to the message
- [ ] Switch back to provider account
- [ ] Verify you see the reply

**Expected**: Messages work both directions, real-time updates

---

## 💳 PAYMENT FLOW (CRITICAL)

### Test 8: Diagnostic Payment
**⚠️ IMPORTANT**: Only test this after switching to Stripe LIVE mode!

- [ ] As homeowner, go to job that's "matched" status
- [ ] Click "Pay for Diagnostic ($85)"
- [ ] Verify Stripe payment form loads
- [ ] Enter test card: 4242 4242 4242 4242
- [ ] Expiry: Any future date (e.g., 12/28)
- [ ] CVC: Any 3 digits (e.g., 123)
- [ ] Click "Pay $85"
- [ ] Verify payment succeeds
- [ ] Verify job status changes to "accepted"
- [ ] Check Stripe dashboard for payment

**Expected**: Payment processes, job status updates, money appears in Stripe

**Test Cards** (Stripe test mode):
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- Requires Auth: 4000 0025 0000 3155

---

### Test 9: Diagnostic Scheduling
- [ ] As provider, go to the accepted job
- [ ] Click "Schedule Diagnostic"
- [ ] Select a date and time
- [ ] Submit the schedule
- [ ] Verify job status changes to "diagnostic_scheduled"
- [ ] As homeowner, verify you see scheduled date

**Expected**: Scheduling works, both parties see the date

---

### Test 10: Diagnostic Report
- [ ] As provider, go to scheduled job
- [ ] Click "Submit Assessment"
- [ ] Fill in diagnostic report:
  - Summary: "Compressor is failing"
  - Recommendation: REPAIR
  - Severity: HIGH
  - Estimated cost: $500
- [ ] Submit report
- [ ] Verify job status changes to "diagnostic_completed"
- [ ] As homeowner, view the diagnostic report
- [ ] Verify all details are correct

**Expected**: Report submission works, homeowner can view it

---

### Test 11: Repair Quote
- [ ] As provider, go to diagnostic_completed job
- [ ] Click "Submit Repair Quote"
- [ ] Enter:
  - Labor cost: $300
  - Parts cost: $200
  - Notes: "Replace compressor unit"
- [ ] Submit quote
- [ ] Verify job status changes to "repair_pending_approval"
- [ ] As homeowner, view the quote
- [ ] Verify total shows $500

**Expected**: Quote submission works, homeowner sees quote

---

### Test 12: Quote Approval
- [ ] As homeowner, on quote approval page
- [ ] Click "Approve Quote"
- [ ] Verify payment authorization (if implemented)
- [ ] Verify job status changes to "repair_approved"
- [ ] As provider, verify job appears in "Active Jobs"

**Expected**: Approval works, job moves to active

---

### Test 13: Job Completion
- [ ] As provider, go to active job
- [ ] Click "Mark as Complete"
- [ ] Confirm completion
- [ ] Verify job status changes to "completed"
- [ ] Verify payment is captured (check Stripe)
- [ ] As homeowner, verify job moves to "Past" tab

**Expected**: Completion works, payment captured, job archived

---

## 📱 MOBILE TESTING

### Test 14: Mobile Responsiveness
- [ ] Open site on mobile device (or use browser dev tools)
- [ ] Test registration on mobile
- [ ] Test creating job on mobile
- [ ] Test messaging on mobile
- [ ] Test payment form on mobile
- [ ] Verify all buttons are tappable
- [ ] Verify text is readable

**Expected**: Site works well on mobile, no layout issues

---

## 🔒 SECURITY TESTING

### Test 15: Authentication
- [ ] Try accessing /dashboard without logging in
- [ ] Verify you're redirected to login
- [ ] Try accessing /provider/dashboard as homeowner
- [ ] Verify you're redirected or see error
- [ ] Try accessing another user's job details
- [ ] Verify you get 403 Forbidden

**Expected**: Protected routes are actually protected

---

### Test 16: Data Validation
- [ ] Try creating job with empty description
- [ ] Verify you see validation error
- [ ] Try submitting payment with invalid card
- [ ] Verify you see error message
- [ ] Try submitting quote with negative amounts
- [ ] Verify validation prevents it

**Expected**: All forms validate input properly

---

## 📊 DATA PERSISTENCE

### Test 17: Data Survives Refresh
- [ ] Create a job
- [ ] Refresh the page
- [ ] Verify job still appears
- [ ] Send a message
- [ ] Refresh the page
- [ ] Verify message still appears

**Expected**: All data persists across page refreshes

---

### Test 18: Data Survives Deployment
- [ ] Note current job count in dashboard
- [ ] Trigger a new deployment (push to GitHub)
- [ ] Wait for deployment to complete
- [ ] Go back to dashboard
- [ ] Verify all jobs still appear
- [ ] Verify no data was lost

**Expected**: Data survives deployments (it's in database, not in app)

---

## 🚨 ERROR HANDLING

### Test 19: Network Errors
- [ ] Open browser dev tools
- [ ] Go to Network tab
- [ ] Set throttling to "Offline"
- [ ] Try to load dashboard
- [ ] Verify you see appropriate error message
- [ ] Set back to "Online"
- [ ] Verify app recovers

**Expected**: Graceful error messages, app recovers when online

---

### Test 20: Invalid URLs
- [ ] Go to https://up-keep-9zbu.vercel.app/invalid-page
- [ ] Verify you see 404 page (not blank screen)
- [ ] Go to /jobs/invalid-id
- [ ] Verify you see error message (not crash)

**Expected**: 404 pages work, invalid IDs handled gracefully

---

## ✅ FINAL CHECKS

### Before Declaring "Ready to Launch"
- [ ] All 20 tests above passed
- [ ] No console errors in browser
- [ ] No 500 errors in Vercel logs
- [ ] Stripe dashboard shows test payments
- [ ] Database shows all test data
- [ ] Email notifications sent (if implemented)
- [ ] Photos uploaded successfully (if implemented)

---

## 📝 TEST RESULTS TEMPLATE

Copy this and fill it out:

```
TEST DATE: _______________
TESTER: _______________
ENVIRONMENT: Production / Staging

HOMEOWNER FLOW:
- Registration: ✅ / ❌
- Job Creation: ✅ / ❌
- AI Diagnosis: ✅ / ❌
- Dashboard: ✅ / ❌

PROVIDER FLOW:
- Registration: ✅ / ❌
- Job Claiming: ✅ / ❌
- Messaging: ✅ / ❌

PAYMENT FLOW:
- Diagnostic Payment: ✅ / ❌
- Scheduling: ✅ / ❌
- Report Submission: ✅ / ❌
- Quote Submission: ✅ / ❌
- Quote Approval: ✅ / ❌
- Job Completion: ✅ / ❌

MOBILE:
- Responsiveness: ✅ / ❌

SECURITY:
- Authentication: ✅ / ❌
- Data Validation: ✅ / ❌

DATA:
- Persistence: ✅ / ❌

ERRORS:
- Error Handling: ✅ / ❌

ISSUES FOUND:
1. _______________
2. _______________
3. _______________

OVERALL STATUS: ✅ READY / ⚠️ NEEDS FIXES / ❌ NOT READY
```

---

## 🎯 QUICK TEST (15 minutes)

If you're short on time, test these minimum flows:

1. **Register as homeowner** → Create job → See AI diagnosis
2. **Register as provider** → Claim job → Send message
3. **Pay diagnostic fee** → Verify payment in Stripe
4. **Complete full workflow** → Job goes to "completed"

If these 4 work, you're 80% ready to launch.

---

## 🆘 COMMON ISSUES & FIXES

### "Application error" on Vercel
- Check Vercel logs: `vercel logs --prod`
- Usually means environment variable missing
- Verify DATABASE_URL is set correctly

### Payment fails
- Check Stripe dashboard for error details
- Verify using correct API keys (test vs live)
- Check STRIPE_SECRET_KEY in Vercel env

### Can't log in after registration
- Check JWT_SECRET is set in Vercel
- Verify database connection working
- Check browser console for errors

### Jobs not appearing
- Verify database connection
- Check API route logs in Vercel
- Ensure user is logged in (check localStorage)

---

## 📞 NEED HELP?

If tests fail:
1. Check browser console for errors
2. Check Vercel deployment logs
3. Check database for data
4. Verify environment variables set
5. Try in incognito mode (clears cache)

**Remember**: It's better to find issues now than after users sign up!
