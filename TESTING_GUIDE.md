# UpKeep Testing Guide

## Overview

This guide walks you through testing the complete instant booking flow before launch.

## Prerequisites

- Local development environment running
- Stripe test mode configured
- Test database with seed data

## Stripe Test Cards

Use these test cards for different scenarios:

- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`
- **Expired Card**: `4000 0000 0000 0069`

For all cards:
- Use any future expiration date (e.g., 12/25)
- Use any 3-digit CVC (e.g., 123)
- Use any ZIP code (e.g., 12345)

## Test Flow 1: Complete Homeowner Journey

### 1.1 Register as Homeowner
1. Go to `/auth/register`
2. Fill in details:
   - Email: `homeowner@test.com`
   - Password: `Test123!`
   - Role: Homeowner
   - First Name: John
   - Last Name: Smith
   - Phone: (415) 555-0123
3. Click "Register"
4. Verify you're redirected to dashboard

### 1.2 Submit a Problem
1. Click "Report New Problem"
2. Fill in details:
   - Category: HVAC
   - Description: "AC not cooling properly, making loud noise"
   - Location: San Francisco, CA 94102
   - Upload a photo (optional)
3. Submit
4. Verify job is created

### 1.3 Chat with AI (Optional)
1. Go to problem chat page
2. Ask questions about the problem
3. Verify AI responds appropriately

### 1.4 Find Professionals
1. Click "Find Professionals"
2. Verify nearby providers are shown
3. Check diagnostic fees are displayed
4. Verify distance calculations

### 1.5 Book Diagnostic Visit
1. Click "Book Diagnostic Visit" on a provider
2. Verify Stripe payment form appears
3. Enter test card: `4242 4242 4242 4242`
4. Complete booking
5. **Verify**:
   - Success message appears
   - Redirected to job details page
   - Job status is "diagnostic_scheduled"
   - Payment is authorized (not captured) in Stripe dashboard

### 1.6 Wait for Repair Quote
1. Provider will submit a repair quote (test in Flow 2)
2. You should see notification or status change
3. Click "Review Quote"

### 1.7 Approve Repair Quote
1. Review quote breakdown:
   - Labor cost
   - Parts cost
   - Diagnostic fee
   - Total
2. Click "Approve & Authorize Payment"
3. **Verify**:
   - Second payment is authorized in Stripe
   - Job status changes to "repair_approved"
   - Both payments show as authorized (not captured)

### 1.8 Job Completion
1. Wait for provider to mark job complete (test in Flow 2)
2. **Verify**:
   - Both payments are captured in Stripe
   - Job status is "completed"
   - Payment record created with correct amounts

## Test Flow 2: Complete Provider Journey

### 2.1 Register as Provider
1. Go to `/auth/register`
2. Fill in details:
   - Email: `provider@test.com`
   - Password: `Test123!`
   - Role: Service Provider
   - Business Name: Cool Air Services
   - Phone: (415) 555-9999
   - Specialties: HVAC
3. Click "Register"

### 2.2 Set Diagnostic Fee
1. Go to `/provider/settings`
2. Set diagnostic fee: $89
3. Save
4. **Verify**: Fee is saved and displayed

### 2.3 View Incoming Bookings
1. Go to `/provider/dashboard`
2. **Verify**:
   - Scheduled diagnostic visits appear
   - Homeowner contact info is visible
   - Diagnostic fee shows as authorized

### 2.4 Capture Diagnostic Payment
1. Click "Capture Diagnostic Payment"
2. Confirm action
3. **Verify**:
   - Payment is captured in Stripe
   - Job status changes to "diagnostic_completed"
   - Success message appears

### 2.5 Submit Repair Quote
1. Click "Submit Repair Quote"
2. Fill in:
   - Labor Cost: $200
   - Parts Cost: $150
   - Notes: "Need to replace compressor"
3. Submit
4. **Verify**:
   - Quote is saved
   - Job status changes to "repair_pending_approval"
   - Homeowner can see the quote

### 2.6 Complete Job
1. After homeowner approves (Flow 1.7)
2. Go to Active Jobs section
3. Click "Mark as Complete"
4. Confirm action
5. **Verify**:
   - Repair payment is captured in Stripe
   - Job status is "completed"
   - Payment record shows:
     * Total amount (diagnostic + repair)
     * Platform fee (15%)
     * Provider payout (85%)

## Test Flow 3: Admin Operations

### 3.1 Access Admin Dashboard
1. Create admin user or update existing user role to ADMIN in database
2. Go to `/admin`
3. **Verify**: Dashboard loads with operations metrics

### 3.2 Test Manual Status Change
1. Find a job in the list
2. Click "Change Status"
3. Select new status
4. **Verify**: Status updates successfully

### 3.3 Test Force Capture
1. Find a job with authorized payment
2. Click "Capture Diagnostic" or "Capture Repair"
3. Confirm action
4. **Verify**:
   - Payment is captured in Stripe
   - Success message appears

### 3.4 Test Refund
1. Find a completed job
2. Click "Issue Refund"
3. Enter reason
4. Confirm
5. **Verify**:
   - Refund processed in Stripe
   - Success message appears

### 3.5 Test Force Complete
1. Find a job in progress
2. Click "Force Complete"
3. Confirm
4. **Verify**:
   - Job marked as completed
   - Payments captured (if not already)
   - Payment record created

## Test Flow 4: Error Scenarios

### 4.1 Declined Card
1. Try to book with card: `4000 0000 0000 0002`
2. **Verify**: Error message appears, booking fails gracefully

### 4.2 Insufficient Funds
1. Try to book with card: `4000 0000 0000 9995`
2. **Verify**: Error message appears, booking fails gracefully

### 4.3 No Providers Available
1. Submit problem in area with no providers
2. **Verify**: "No providers available" message shows

### 4.4 Duplicate Booking
1. Try to book same provider twice for same job
2. **Verify**: Error message prevents duplicate

### 4.5 Unauthorized Access
1. Try to access another user's job
2. **Verify**: 401/403 error or redirect

## Test Flow 5: Mobile Responsiveness

### 5.1 iPhone Safari
1. Open app on iPhone or use Chrome DevTools device emulation
2. Test all flows above
3. **Verify**:
   - All buttons are tappable (44x44px minimum)
   - Forms are easy to fill
   - No horizontal scrolling
   - Text is readable

### 5.2 Android Chrome
1. Open app on Android or use Chrome DevTools
2. Test all flows above
3. **Verify**: Same as iPhone

## Verification Checklist

After testing, verify in Stripe Dashboard:

- [ ] Authorized payments appear in Payments section
- [ ] Captured payments show as "Succeeded"
- [ ] Refunds appear correctly
- [ ] Payment amounts match expected values
- [ ] Platform fee (15%) calculated correctly

## Database Verification

Check in database or Prisma Studio:

```bash
npx prisma studio
```

Verify:
- [ ] JobRequest records have correct status
- [ ] RepairQuote records created
- [ ] Payment records have correct amounts
- [ ] ServiceProviderProfile has diagnostic fee set
- [ ] Payment intent IDs are stored

## Performance Testing

### Load Time
- [ ] Homepage loads in < 2 seconds
- [ ] Dashboard loads in < 3 seconds
- [ ] API responses < 500ms

### API Endpoints
Test each endpoint with curl or Postman:

```bash
# Health check
curl http://localhost:3000/api/health

# Get jobs (with auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/jobs

# Nearby providers
curl -H "Authorization: Bearer YOUR_TOKEN" "http://localhost:3000/api/providers/nearby?lat=37.7749&lng=-122.4194&category=hvac"
```

## Common Issues & Solutions

### Payment Not Captured
- Check Stripe dashboard for payment intent status
- Verify payment intent ID is stored in database
- Check API logs for errors

### Provider Not Showing
- Verify provider has diagnostic fee set
- Check provider's service area includes job location
- Verify provider specialty matches job category
- Check provider isActive status

### Job Status Not Updating
- Check API response for errors
- Verify database connection
- Check Prisma schema matches database

### Authentication Fails
- Verify JWT_SECRET is set
- Check token expiration
- Clear localStorage and re-login

## Automated Testing (Future)

Consider adding:
- Unit tests for API endpoints
- Integration tests for payment flow
- E2E tests with Playwright or Cypress
- Load testing with k6 or Artillery

## Pre-Launch Checklist

Before going live:

- [ ] All test flows pass
- [ ] No console errors
- [ ] All API endpoints return correct data
- [ ] Stripe test mode works perfectly
- [ ] Mobile responsive on real devices
- [ ] Admin dashboard functional
- [ ] Error messages are user-friendly
- [ ] Loading states work correctly
- [ ] No sensitive data in logs
- [ ] Database migrations run successfully

## Launch Day Testing

After deploying to production:

1. Test with real Stripe account (small amount)
2. Verify webhooks work (if configured)
3. Monitor error logs
4. Check database connections
5. Test from different locations/devices
6. Have rollback plan ready

## Support During Beta

- Monitor admin dashboard daily
- Check Stripe dashboard for payment issues
- Review error logs
- Be ready to use admin tools for manual intervention
- Collect user feedback
- Track completion rates
