# Vercel Deployment Guide - UpKeep Platform

**Time Required**: 30-45 minutes  
**Prerequisites**: Vercel account, GitHub repository

---

## 🚀 Quick Deployment Steps

### 1. Push to GitHub (5 min)

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for deployment - all critical fixes complete"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/upkeep.git

# Push
git push -u origin main
```

---

### 2. Connect to Vercel (5 min)

1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import your GitHub repository
4. Select the UpKeep repository
5. Click "Import"

---

### 3. Configure Build Settings (2 min)

Vercel should auto-detect Next.js. Verify:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node Version**: 18.x or higher

Click "Continue" (don't deploy yet!)

---

### 4. Add Environment Variables (10 min)

Click "Environment Variables" and add these:

#### Required Variables

```env
# Database (use your production database)
DATABASE_URL=postgresql://user:password@host:5432/upkeep_prod

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-now
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-now

# Stripe (use LIVE keys for production, TEST keys for staging)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Email (Resend)
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com

# AWS S3 (for media storage)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=upkeep-media-prod

# Application
NODE_ENV=production
```

**Important**: 
- Use **test mode** Stripe keys (`sk_test_...`) for staging
- Use **live mode** Stripe keys (`sk_live_...`) for production
- Generate strong random strings for JWT secrets

---

### 5. Deploy (2 min)

1. Click "Deploy"
2. Wait for build to complete (2-3 minutes)
3. Vercel will show deployment URL

---

### 6. Run Database Migrations (5 min)

After first deployment, you need to run migrations:

**Option A: Using Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Run migration command
vercel env pull .env.production
npx prisma migrate deploy
```

**Option B: Using your local machine**
```bash
# Set production DATABASE_URL temporarily
export DATABASE_URL="your-production-database-url"

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

**Option C: Using Vercel Dashboard**
1. Go to your project settings
2. Add a "Deploy Hook" 
3. Trigger deployment
4. Migrations run automatically if configured in `package.json`

---

### 7. Verify Deployment (10 min)

Visit your Vercel URL and test:

#### Quick Smoke Test
1. ✅ Homepage loads
2. ✅ Register page works
3. ✅ Can create account
4. ✅ Can login
5. ✅ Dashboard loads
6. ✅ Can submit problem
7. ✅ Photo upload works
8. ✅ Can find professionals
9. ✅ Booking modal opens
10. ✅ Stripe form loads

#### Test with Stripe Test Mode
If using test keys:
- Card: `4242 4242 4242 4242`
- Complete a test booking
- Verify in Stripe dashboard

---

## 🔧 Common Issues & Solutions

### Issue: Build Fails

**Error**: `Module not found` or `Cannot find module`

**Solution**:
```bash
# Locally, ensure all dependencies are installed
npm install

# Commit package-lock.json
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

---

### Issue: Database Connection Fails

**Error**: `Can't reach database server`

**Solution**:
1. Check DATABASE_URL is correct
2. Ensure database allows connections from Vercel IPs
3. For Supabase/Railway: Enable "Allow external connections"
4. For Neon: Connection pooling should be enabled

---

### Issue: Prisma Client Not Generated

**Error**: `@prisma/client did not initialize yet`

**Solution**:
Add to `package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

Then:
```bash
git add package.json
git commit -m "Add prisma generate to postinstall"
git push
```

---

### Issue: Environment Variables Not Working

**Error**: `undefined` or `null` for env vars

**Solution**:
1. Check variable names match exactly (case-sensitive)
2. For client-side vars, must start with `NEXT_PUBLIC_`
3. Redeploy after adding env vars
4. Check "Production" environment is selected

---

### Issue: Stripe Payments Fail

**Error**: `Invalid API key` or `No such payment method`

**Solution**:
1. Verify Stripe keys are correct
2. Check using test keys in test mode
3. Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
4. Check Stripe dashboard for errors

---

## 📊 Database Setup Options

### Option 1: Vercel Postgres (Easiest)
```bash
# In Vercel dashboard
1. Go to Storage tab
2. Create Postgres database
3. Copy connection string
4. Add as DATABASE_URL environment variable
```

### Option 2: Supabase (Free tier)
```bash
1. Go to https://supabase.com
2. Create new project
3. Get connection string from Settings > Database
4. Format: postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
```

### Option 3: Railway (Free tier)
```bash
1. Go to https://railway.app
2. Create new project
3. Add PostgreSQL service
4. Copy DATABASE_URL from variables
```

### Option 4: Neon (Free tier)
```bash
1. Go to https://neon.tech
2. Create new project
3. Copy connection string
4. Enable connection pooling
```

---

## 🔐 Security Checklist

Before going live:

- [ ] Change all default secrets (JWT_SECRET, etc.)
- [ ] Use strong random strings (32+ characters)
- [ ] Switch to Stripe live mode keys
- [ ] Enable HTTPS (Vercel does this automatically)
- [ ] Set up custom domain (optional)
- [ ] Configure CORS if needed
- [ ] Review Vercel security headers
- [ ] Enable Vercel password protection for staging

---

## 🌐 Custom Domain Setup (Optional)

1. Go to Project Settings > Domains
2. Add your domain (e.g., `upkeep.com`)
3. Follow DNS configuration instructions
4. Wait for DNS propagation (5-60 minutes)
5. Vercel automatically provisions SSL certificate

---

## 📧 Email Setup (Resend)

1. Go to https://resend.com
2. Create account
3. Add domain or use `onboarding@resend.dev` for testing
4. Get API key
5. Add to Vercel environment variables:
   - `RESEND_API_KEY`
   - `EMAIL_FROM`

---

## 💳 Stripe Setup

### Test Mode (for staging)
1. Go to https://dashboard.stripe.com/test
2. Get test API keys
3. Add to Vercel environment variables

### Live Mode (for production)
1. Complete Stripe account verification
2. Go to https://dashboard.stripe.com/apikeys
3. Get live API keys
4. Add to Vercel environment variables
5. Set up webhooks (optional for MVP)

---

## 🎯 Deployment Checklist

### Before First Deploy
- [ ] All code committed to GitHub
- [ ] Environment variables prepared
- [ ] Database ready (Supabase/Railway/Neon)
- [ ] Stripe account set up
- [ ] Resend account set up (for emails)
- [ ] AWS S3 bucket created (for media)

### After First Deploy
- [ ] Run database migrations
- [ ] Test registration
- [ ] Test login
- [ ] Test photo upload
- [ ] Test booking flow
- [ ] Test Stripe payments
- [ ] Check error logs in Vercel

### Before Public Launch
- [ ] Switch to Stripe live mode
- [ ] Set up custom domain
- [ ] Test on mobile devices
- [ ] Load test (optional)
- [ ] Set up monitoring (Sentry, etc.)

---

## 📱 Vercel CLI Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls

# Pull environment variables
vercel env pull

# Add environment variable
vercel env add
```

---

## 🔍 Monitoring & Logs

### View Logs
1. Go to Vercel dashboard
2. Select your project
3. Click "Deployments"
4. Click on a deployment
5. Click "Logs" tab

### Real-time Logs
```bash
vercel logs --follow
```

### Error Tracking (Optional)
Add Sentry for error tracking:
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

---

## 🚀 Continuous Deployment

Vercel automatically deploys when you push to GitHub:

- **Push to `main`** → Production deployment
- **Push to other branches** → Preview deployment
- **Pull requests** → Preview deployment with unique URL

---

## 💰 Vercel Pricing

- **Hobby (Free)**:
  - 100GB bandwidth/month
  - Unlimited deployments
  - Perfect for beta testing

- **Pro ($20/month)**:
  - 1TB bandwidth/month
  - Team collaboration
  - Better for production

Start with Hobby, upgrade when needed.

---

## 🎉 You're Ready!

Your UpKeep platform is now deployed on Vercel!

**Next Steps**:
1. Test thoroughly on production URL
2. Onboard first providers
3. Get first bookings
4. Monitor and iterate

**Need help?** Check Vercel docs: https://vercel.com/docs

**Good luck with your launch! 🚀**

