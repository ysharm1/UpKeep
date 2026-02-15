# UpKeep Platform - Complete Deployment Guide

## 🚀 Quick Start: Deploy to Vercel in 15 Minutes

This guide will walk you through deploying your UpKeep platform to production on Vercel.

---

## Prerequisites Checklist

Before starting, make sure you have:

- ✅ GitHub repository with latest code pushed
- ✅ Vercel account (free tier is fine to start)
- ✅ Stripe account with test keys
- ✅ OpenAI API key
- ✅ Production database ready (we'll set this up)

---

## Step 1: Set Up Production Database (10 minutes)

### Option A: Supabase (Recommended - Free Tier Available)

1. **Create Supabase Account**
   - Go to https://supabase.com
   - Sign up with GitHub (easiest)

2. **Create New Project**
   - Click "New Project"
   - Name: `upkeep-production`
   - Database Password: Generate a strong password (save it!)
   - Region: Choose closest to your users (e.g., US West)
   - Click "Create new project" (takes ~2 minutes)

3. **Get Database URL**
   - Go to Project Settings → Database
   - Find "Connection string" → "URI"
   - Copy the connection string (looks like):
     ```
     postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
     ```
   - Replace `[YOUR-PASSWORD]` with your actual password
   - **Save this URL** - you'll need it for Vercel

### Option B: Neon (Alternative - Also Free Tier)

1. Go to https://neon.tech
2. Sign up and create new project
3. Copy the connection string
4. Save for later

---

## Step 2: Deploy to Vercel (5 minutes)

### 2.1: Import Your Repository

1. **Go to Vercel**
   - Visit https://vercel.com
   - Click "Add New..." → "Project"

2. **Import GitHub Repository**
   - Find your `UpKeep` repository
   - Click "Import"

3. **Configure Project**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (leave as is)
   - Build Command: `npm run build` (auto-filled)
   - Output Directory: `.next` (auto-filled)

### 2.2: Add Environment Variables

Click "Environment Variables" and add these one by one:

#### Database
```
DATABASE_URL
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

#### JWT Secrets (Generate Random Strings)
```
JWT_SECRET
[Generate 32-character random string]

JWT_REFRESH_SECRET
[Generate 32-character random string]
```

**How to generate random strings:**
- Mac/Linux: Run `openssl rand -base64 32` in terminal
- Or use: https://www.random.org/strings/

#### OpenAI
```
OPENAI_API_KEY
[Your OpenAI API key from .env file]
```

#### Stripe (Use Test Keys First)
```
STRIPE_SECRET_KEY
[Your Stripe secret key from .env file - starts with sk_test_]

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
[Your Stripe publishable key from .env file - starts with pk_test_]
```

#### App URL (You'll update this after deployment)
```
NEXT_PUBLIC_APP_URL
https://your-app-name.vercel.app
```

### 2.3: Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like: `https://upkeep-xxxxx.vercel.app`

---

## Step 3: Run Database Migrations (3 minutes)

Your database is empty! You need to create the tables.

### 3.1: Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

### 3.2: Login to Vercel

```bash
vercel login
```

### 3.3: Link Your Project

```bash
cd /Users/yashsharma/UpKeep\(Noncrashed\)\ 
vercel link
```

Follow prompts:
- Set up and deploy? **N** (No)
- Link to existing project? **Y** (Yes)
- Select your project from the list

### 3.4: Pull Environment Variables

```bash
vercel env pull .env.production
```

This downloads your production environment variables.

### 3.5: Run Migrations

```bash
# Use production database URL
DATABASE_URL="your_production_database_url" npx prisma migrate deploy
```

Or if you pulled env vars:

```bash
# Load from .env.production
export $(cat .env.production | xargs)
npx prisma migrate deploy
```

You should see:
```
✓ Applying migration `20231201000000_init`
✓ Applying migration `20231202000000_add_fields`
... (all migrations)
✓ Database is now in sync with schema
```

---

## Step 4: Update App URL (1 minute)

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find `NEXT_PUBLIC_APP_URL`
3. Update value to your actual Vercel URL: `https://upkeep-xxxxx.vercel.app`
4. Click "Save"
5. Go to Deployments → Click "..." on latest deployment → "Redeploy"

---

## Step 5: Test Your Production App (10 minutes)

### 5.1: Basic Smoke Test

1. Visit your Vercel URL
2. Check homepage loads
3. Try to register a new account
4. Verify email/password validation works

### 5.2: Full Flow Test

Follow the testing guide from `TESTING_AND_LAUNCH_GUIDE.md`:

1. **Register as Homeowner**
   - Use real email (you'll want to test emails later)
   - Complete profile with address

2. **Create a Problem**
   - Select HVAC category
   - Describe issue
   - Test AI chatbot
   - Upload photo (if you have cloud storage configured)

3. **Register as Provider** (use incognito window)
   - Set diagnostic fee
   - Set specialties

4. **Claim Job**
   - Go to Find Jobs
   - Claim the job you created

5. **Book Diagnostic Visit**
   - Switch to homeowner account
   - Book with provider
   - Use Stripe test card: `4242 4242 4242 4242`

6. **Verify Payment**
   - Check Stripe dashboard: https://dashboard.stripe.com/test/payments
   - Verify payment appears

---

## Step 6: Configure Stripe Webhooks (Optional but Recommended)

Webhooks allow Stripe to notify your app about payment events.

### 6.1: Create Webhook Endpoint

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-app.vercel.app/api/webhooks/stripe`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Click "Add endpoint"

### 6.2: Get Webhook Secret

1. Click on your new webhook
2. Copy "Signing secret" (starts with `whsec_`)
3. Add to Vercel environment variables:
   ```
   STRIPE_WEBHOOK_SECRET
   whsec_xxxxxxxxxxxxx
   ```
4. Redeploy

---

## Step 7: Set Up Cloud Storage (Optional)

For photo uploads to work in production, you need cloud storage.

### Option A: AWS S3

1. **Create S3 Bucket**
   - Go to AWS Console → S3
   - Create bucket: `upkeep-media-production`
   - Region: Same as your app
   - Block public access: OFF (for public URLs)

2. **Create IAM User**
   - Go to IAM → Users → Add user
   - Name: `upkeep-app`
   - Access type: Programmatic access
   - Attach policy: `AmazonS3FullAccess`
   - Save Access Key ID and Secret Access Key

3. **Add to Vercel Environment Variables**
   ```
   CLOUD_STORAGE_BUCKET=upkeep-media-production
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=us-east-1
   ```

### Option B: Cloudinary (Easier)

1. Sign up at https://cloudinary.com (free tier)
2. Get your credentials from dashboard
3. Update code to use Cloudinary SDK instead of S3

---

## Step 8: Monitor Your App

### 8.1: Vercel Analytics (Built-in)

- Go to your project → Analytics
- See page views, performance, errors

### 8.2: Add Error Tracking (Recommended)

**Option: Sentry**

1. Sign up at https://sentry.io
2. Create new project (Next.js)
3. Install Sentry:
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```
4. Follow wizard to configure
5. Commit and push changes

---

## Troubleshooting

### Build Fails

**Error: "Cannot find module '@prisma/client'"**

Solution: Add build command in Vercel:
```bash
npx prisma generate && next build
```

Go to: Settings → General → Build & Development Settings → Build Command

**Error: "Database connection failed"**

Solution: Check your `DATABASE_URL` is correct:
- Has correct password
- Uses `pooler.supabase.com` (not `db.supabase.com`)
- Port is 5432

### App Loads but Features Don't Work

**Stripe not working:**
- Check `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- Verify it starts with `pk_test_` or `pk_live_`
- Check browser console for errors

**AI Chatbot not working:**
- Verify `OPENAI_API_KEY` is set correctly
- Check OpenAI dashboard for API usage/errors
- Look at Vercel function logs

**Photos not uploading:**
- Cloud storage not configured (optional feature)
- Can skip for initial launch

### Database Issues

**Tables don't exist:**
- Run migrations again: `npx prisma migrate deploy`
- Check Supabase dashboard → Table Editor

**Can't connect to database:**
- Verify connection string is correct
- Check Supabase project is running
- Try connecting with `psql` or TablePlus

---

## Going Live with Real Payments

When you're ready to accept real money:

### 1. Activate Stripe Account

1. Go to Stripe Dashboard
2. Complete business verification
3. Add bank account for payouts
4. Switch to "Live mode"

### 2. Get Live API Keys

1. Stripe Dashboard → Developers → API Keys
2. Copy "Publishable key" (starts with `pk_live_`)
3. Copy "Secret key" (starts with `sk_live_`)

### 3. Update Vercel Environment Variables

Replace test keys with live keys:
```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 4. Update Webhook

1. Create new webhook for production
2. Use live mode endpoint
3. Update `STRIPE_WEBHOOK_SECRET`

### 5. Test with Real Card

Use a real credit card (yours) to test:
- Small amount ($1)
- Verify payment goes through
- Check payout appears in Stripe

---

## Custom Domain (Optional)

### 1. Buy Domain

- Namecheap, GoDaddy, Google Domains
- Example: `upkeep.com`

### 2. Add to Vercel

1. Go to Project Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions

### 3. Update Environment Variable

```
NEXT_PUBLIC_APP_URL=https://upkeep.com
```

---

## Cost Breakdown

### Free Tier (0-100 users/month)

- **Vercel**: Free (Hobby plan)
  - 100 GB bandwidth
  - Unlimited deployments
  - Automatic HTTPS

- **Supabase**: Free
  - 500 MB database
  - 1 GB file storage
  - 2 GB bandwidth

- **Stripe**: Free
  - 2.9% + $0.30 per transaction
  - No monthly fees

- **OpenAI**: Pay-as-you-go
  - GPT-4o-mini: $0.15 per 1M input tokens
  - ~$0.01 per conversation
  - Estimate: $5-10/month for 100 users

**Total: $5-10/month**

### Paid Tier (100-1,000 users/month)

- **Vercel Pro**: $20/month
  - 1 TB bandwidth
  - Advanced analytics

- **Supabase Pro**: $25/month
  - 8 GB database
  - 100 GB file storage
  - 250 GB bandwidth

- **Stripe**: 2.9% + $0.30 per transaction
  - Example: 500 transactions × $100 = $50,000 revenue
  - Stripe fees: ~$1,600

- **OpenAI**: $20-50/month

**Total: $65-95/month + transaction fees**

---

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Run database migrations
3. ✅ Test production app
4. ⏳ Invite beta users (friends & family)
5. ⏳ Collect feedback
6. ⏳ Fix critical bugs
7. ⏳ Launch publicly

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs

---

## Emergency Contacts

If something breaks in production:

1. **Check Vercel Logs**
   - Project → Deployments → Click deployment → Runtime Logs

2. **Check Database**
   - Supabase Dashboard → Table Editor
   - Verify data exists

3. **Check Stripe**
   - Dashboard → Payments
   - Look for failed payments

4. **Rollback Deployment**
   - Vercel → Deployments → Previous deployment → "Promote to Production"

---

Good luck with your launch! 🚀

You've built something awesome. Now go make it successful!
