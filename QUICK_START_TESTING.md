# Quick Start Testing - Right Now!

## Step 1: Configure Stripe Keys (REQUIRED)

You need Stripe test keys to test payments. Here's how to get them:

### Get Your Stripe Test Keys

1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy these two keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### Add to .env File

Open your `.env` file and add:

```bash
STRIPE_SECRET_KEY="sk_test_YOUR_KEY_HERE"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_KEY_HERE"
```

**Without these keys, payment testing will fail!**

---

## Step 2: Database Setup

```bash
# Install dependencies (if not already done)
npm install

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

---

## Step 3: Start Development Server

```bash
npm run dev
```

Server will start at: http://localhost:3000

---

## Step 4: Quick Test Flow (10 minutes)

### Test 1: Register Homeowner
1. Open http://localhost:3000
2. Click "Sign Up"
3. Register as homeowner
4. Email: `test@example.com`
5. Password: `password123`

### Test 2: Register Provider (New Incognito Window)
1. Open new incognito/private window
2. Go to http://localhost:3000
3. Click "Sign Up"
4. Register as provider
5. Email: `provider@example.com`
6. Password: `password123`

### Test 3: Set Provider Diagnostic Fee
```bash
# In a new terminal
npx prisma studio
```
1. Open `ServiceProviderProfile` table
2. Find your provider
3. Set `diagnosticFee` to `89`
4. Save

### Test 4: Book Diagnostic Visit (Homeowner Window)
1. Click "Get Help with a Problem"
2. Fill in problem details
3. Click "Hire Professional"
4. Click "Book Diagnostic Visit"
5. Select date/time
6. Enter test card: `4242 4242 4242 4242`
7. Complete booking

### Test 5: Verify in Stripe
1. Go to https://dashboard.stripe.com/test/payments
2. You should see payment with status "Uncaptured"

**If you see the payment in Stripe → Core flow works! ✅**

---

## Stripe Test Cards

- **Success:** `4242 4242 4242 4242`
- **Declined:** `4000 0000 0000 0002`
- **Expiry:** Any future date (e.g., `12/25`)
- **CVC:** Any 3 digits (e.g., `123`)

---

## What to Check

✅ Homeowner can register
✅ Provider can register  
✅ Booking modal opens
✅ Scheduling picker works
✅ Payment form appears
✅ Stripe payment authorizes
✅ Job appears on dashboards

---

## If Something Breaks

1. Check browser console (F12)
2. Check terminal for errors
3. Verify Stripe keys in `.env`
4. Restart dev server

---

## Full Testing Guide

For complete testing instructions, see: **LOCAL_TESTING_GUIDE.md**
