# 🚀 LAUNCH TODAY - Step-by-Step Guide

**Goal**: Get your app production-ready and launch in 4-6 hours
**Current Status**: App works, but needs security fixes and service setup

---

## ⏱️ TIME BREAKDOWN

- **Phase 1**: Security (1 hour) - CRITICAL
- **Phase 2**: Services Setup (2-3 hours) - HIGH PRIORITY  
- **Phase 3**: Testing (1 hour) - REQUIRED
- **Phase 4**: Launch (30 minutes) - GO LIVE

**Total**: 4.5 - 5.5 hours

---

## 🔴 PHASE 1: SECURITY (1 HOUR) - DO THIS FIRST!

### Step 1.1: Generate New JWT Secrets (2 minutes)
```bash
# Already done! Use these values:
JWT_SECRET: 5ba59629811a85fb581490e84dc7347b0804903116d0bb97de70b286f7e0615afc0df71946faee68e371670e990c2fcf4ffb7fece612d3385d3e2262fd87b70c

JWT_REFRESH_SECRET: a8726836c88f2e712a70c7a9c886d08ba053a4a6be1167c7e38ae80d0cad5ab1ab0fce5499cd73c2df3f9749db6c9c266f7f24167de8b50d46feeac9b95d75e1
```

### Step 1.2: Update JWT Secrets in Vercel (5 minutes)
```bash
# Remove old secrets
vercel env rm JWT_SECRET production
vercel env rm JWT_REFRESH_SECRET production

# Add new secrets (paste values from above when prompted)
vercel env add JWT_SECRET production
vercel env add JWT_REFRESH_SECRET production
```

### Step 1.3: Rotate Database Password (10 minutes)
1. Go to: https://supabase.com/dashboard/project/umtacdslewohvlfukzua/settings/database
2. Click "Reset database password"
3. Generate new password (save it somewhere safe!)
4. Update in Vercel:
```bash
vercel env rm DATABASE_URL production
vercel env add DATABASE_URL production
# Enter: postgresql://postgres:NEW_PASSWORD@db.umtacdslewohvlfukzua.supabase.co:5432/postgres
```
5. Update in local .env file too

### Step 1.4: Rotate OpenAI API Key (5 minutes)
1. Go to: https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Name it "UpKeep Production"
4. Copy the key
5. Delete the old key (the one exposed in chat)
6. Update in Vercel:
```bash
vercel env rm OPENAI_API_KEY production
vercel env add OPENAI_API_KEY production
# Paste new key
```

### Step 1.5: Switch Stripe to Live Mode (15 minutes)
1. Go to: https://dashboard.stripe.com
2. Toggle to "Live mode" (top right corner)
3. Go to Developers > API keys
4. Copy "Publishable key" (starts with pk_live_)
5. Click "Reveal test key" for Secret key (starts with sk_live_)
6. Update in Vercel:
```bash
vercel env rm STRIPE_SECRET_KEY production
vercel env rm NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production

vercel env add STRIPE_SECRET_KEY production
# Paste sk_live_... key

vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
# Paste pk_live_... key
```

### Step 1.6: Update Production URL (2 minutes)
```bash
vercel env rm NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_APP_URL production
# Enter: https://up-keep-9zbu.vercel.app
```

### Step 1.7: Redeploy (5 minutes)
```bash
vercel --prod
```
Wait for deployment to complete, then verify at: https://up-keep-9zbu.vercel.app

**✅ Phase 1 Complete! Your app is now secure.**

---

## 🟡 PHASE 2: SERVICES SETUP (2-3 HOURS)

### Step 2.1: Email Service - Resend (30 minutes)

**Why**: Users need to receive emails for verification, notifications, etc.

1. **Sign up for Resend** (5 min)
   - Go to: https://resend.com
   - Sign up with your email
   - Verify your email

2. **Get API Key** (2 min)
   - Go to API Keys section
   - Click "Create API Key"
   - Name it "UpKeep Production"
   - Copy the key

3. **Install Resend** (2 min)
```bash
npm install resend
```

4. **Add to Vercel** (2 min)
```bash
vercel env add RESEND_API_KEY production
# Paste the API key
```

5. **Update Email Service** (15 min)

Edit `lib/email.ts`:
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'UpKeep <noreply@yourdomain.com>', // Change this!
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error('Email error:', error);
      return false;
    }

    console.log('Email sent:', data);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}
```

6. **Verify Domain** (optional, 5 min)
   - In Resend dashboard, add your domain
   - Add DNS records they provide
   - This lets you send from your@yourdomain.com instead of noreply@resend.dev

7. **Test Email** (2 min)
   - Register a new user
   - Check if verification email arrives
   - If not, check Resend dashboard logs

### Step 2.2: Photo Uploads - AWS S3 (1.5 hours)

**Why**: Users need to upload photos of their problems

**Option A: AWS S3 (Recommended)**

1. **Create AWS Account** (10 min)
   - Go to: https://aws.amazon.com
   - Sign up (requires credit card)
   - Verify email and phone

2. **Create S3 Bucket** (10 min)
   - Go to S3 console: https://s3.console.aws.amazon.com
   - Click "Create bucket"
   - Name: `upkeep-media-production` (must be globally unique)
   - Region: `us-east-1` (or closest to you)
   - Uncheck "Block all public access" (we need public read)
   - Click "Create bucket"

3. **Configure Bucket Policy** (5 min)
   - Click on your bucket
   - Go to "Permissions" tab
   - Click "Bucket Policy"
   - Paste this:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::upkeep-media-production/*"
    }
  ]
}
```
   - Click "Save"

4. **Create IAM User** (15 min)
   - Go to IAM console: https://console.aws.amazon.com/iam
   - Click "Users" > "Add users"
   - Username: `upkeep-app`
   - Access type: "Programmatic access"
   - Click "Next"
   - Click "Attach policies directly"
   - Search for "AmazonS3FullAccess"
   - Check the box
   - Click "Next" > "Create user"
   - **IMPORTANT**: Copy Access Key ID and Secret Access Key (you won't see them again!)

5. **Add to Vercel** (5 min)
```bash
vercel env add AWS_ACCESS_KEY_ID production
# Paste Access Key ID

vercel env add AWS_SECRET_ACCESS_KEY production
# Paste Secret Access Key

vercel env add CLOUD_STORAGE_BUCKET production
# Enter: upkeep-media-production

vercel env add AWS_REGION production
# Enter: us-east-1
```

6. **Install AWS SDK** (2 min)
```bash
npm install @aws-sdk/client-s3
```

7. **Update Upload Code** (20 min)

Edit `app/api/media/upload/route.ts` to use S3 instead of local storage.

8. **Test Upload** (5 min)
   - Create a new job
   - Try uploading a photo
   - Verify it appears in S3 bucket
   - Verify you can see it in the app

**Option B: Cloudinary (Easier, 30 min)**

If AWS seems too complex, use Cloudinary instead:

1. Sign up: https://cloudinary.com
2. Get API credentials from dashboard
3. Install: `npm install cloudinary`
4. Add to Vercel:
```bash
vercel env add CLOUDINARY_CLOUD_NAME production
vercel env add CLOUDINARY_API_KEY production
vercel env add CLOUDINARY_API_SECRET production
```
5. Update upload code to use Cloudinary SDK

### Step 2.3: Commit and Deploy (10 min)
```bash
git add -A
git commit -m "Add email service and photo uploads"
git push origin main
```

Wait for Vercel to deploy automatically.

**✅ Phase 2 Complete! All services are set up.**

---

## 🧪 PHASE 3: TESTING (1 HOUR)

Follow the testing checklist in `PRE_LAUNCH_TEST.md`

**Minimum tests to run:**

1. **Register as homeowner** (5 min)
   - Use a real email you can check
   - Verify email arrives (if email service set up)
   - Log in successfully

2. **Create a job** (5 min)
   - Upload a photo (if photo service set up)
   - Get AI diagnosis
   - Verify job appears on dashboard

3. **Register as provider** (5 min)
   - Use different email
   - Fill in business details
   - See provider dashboard

4. **Claim job** (5 min)
   - Find the job you created
   - Claim it
   - Send a message to homeowner

5. **Test payment** (10 min)
   - As homeowner, pay diagnostic fee
   - Use real card (will charge $85!)
   - Verify payment in Stripe dashboard
   - Verify job status updates

6. **Complete workflow** (20 min)
   - Schedule diagnostic
   - Submit diagnostic report
   - Submit repair quote
   - Approve quote
   - Complete job
   - Verify job archived

7. **Mobile test** (10 min)
   - Open on phone
   - Try registration
   - Try creating job
   - Verify everything works

**If all tests pass, you're ready to launch!**

---

## 🎉 PHASE 4: LAUNCH (30 MINUTES)

### Step 4.1: Final Checks (10 min)
- [ ] All environment variables set in Vercel
- [ ] Latest code deployed to production
- [ ] Test payment succeeded in Stripe
- [ ] Email service working
- [ ] Photo uploads working
- [ ] No errors in Vercel logs
- [ ] Mobile site works

### Step 4.2: Create Legal Pages (15 min)

**Quick Templates:**

Create `app/terms/page.tsx`:
```typescript
export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      <div className="prose">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <h2>1. Acceptance of Terms</h2>
        <p>By using UpKeep, you agree to these terms...</p>
        {/* Add more sections */}
      </div>
    </div>
  );
}
```

Create `app/privacy/page.tsx`:
```typescript
export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <h2>1. Information We Collect</h2>
        <p>We collect information you provide...</p>
        {/* Add more sections */}
      </div>
    </div>
  );
}
```

**Or use a generator:**
- https://www.termsfeed.com/terms-service-generator/
- https://www.termsfeed.com/privacy-policy-generator/

### Step 4.3: Add Footer Links (5 min)

Add to your layout or landing page:
```typescript
<footer className="bg-gray-800 text-white py-8">
  <div className="max-w-7xl mx-auto px-4 text-center">
    <div className="flex justify-center gap-6 mb-4">
      <Link href="/terms">Terms of Service</Link>
      <Link href="/privacy">Privacy Policy</Link>
      <Link href="mailto:support@yourdomain.com">Contact</Link>
    </div>
    <p className="text-sm text-gray-400">
      © 2026 UpKeep. All rights reserved.
    </p>
  </div>
</footer>
```

### Step 4.4: Go Live! (1 min)

**You're ready!** Share your URL:
- https://up-keep-9zbu.vercel.app

**First users:**
- Share with friends/family first
- Ask them to test and give feedback
- Monitor for any issues
- Be ready to fix bugs quickly

---

## 📊 POST-LAUNCH MONITORING

### First Hour
- [ ] Check Vercel logs every 10 minutes
- [ ] Monitor Stripe dashboard for payments
- [ ] Check database for new signups
- [ ] Respond to any user questions

### First Day
- [ ] Check for error reports
- [ ] Verify all payments processed
- [ ] Ensure emails are sending
- [ ] Monitor user feedback

### First Week
- [ ] Analyze user behavior
- [ ] Fix any reported bugs
- [ ] Optimize slow pages
- [ ] Plan improvements

---

## 🆘 EMERGENCY CONTACTS

**If something breaks:**

1. **Check Vercel logs:**
```bash
vercel logs --prod
```

2. **Check database:**
```bash
PGPASSWORD='YOUR_NEW_PASSWORD' psql -h db.umtacdslewohvlfukzua.supabase.co -U postgres -d postgres
```

3. **Rollback if needed:**
```bash
# Find previous deployment
vercel ls

# Promote previous deployment
vercel promote <deployment-url> --prod
```

4. **Status pages:**
   - Vercel: https://vercel-status.com
   - Supabase: https://status.supabase.com
   - Stripe: https://status.stripe.com

---

## ✅ LAUNCH CHECKLIST

Print this and check off as you go:

### Security (Phase 1)
- [ ] JWT secrets rotated
- [ ] Database password changed
- [ ] OpenAI key rotated
- [ ] Stripe switched to live mode
- [ ] Production URL updated
- [ ] Redeployed to Vercel

### Services (Phase 2)
- [ ] Email service set up (Resend)
- [ ] Photo uploads working (S3/Cloudinary)
- [ ] Tested email delivery
- [ ] Tested photo upload

### Testing (Phase 3)
- [ ] Homeowner registration works
- [ ] Provider registration works
- [ ] Job creation works
- [ ] Payment processing works
- [ ] Full workflow tested
- [ ] Mobile site tested

### Launch (Phase 4)
- [ ] Terms of Service page created
- [ ] Privacy Policy page created
- [ ] Footer links added
- [ ] Final checks complete
- [ ] URL shared with first users

---

## 🎯 SUCCESS METRICS

**Day 1 Goals:**
- 5-10 user signups
- 1-2 jobs created
- 0 critical errors
- All payments successful

**Week 1 Goals:**
- 50+ user signups
- 10+ jobs created
- 5+ jobs completed
- Positive user feedback

**Month 1 Goals:**
- 200+ users
- 50+ jobs completed
- $1,000+ in payments processed
- 4.5+ star rating

---

## 🚀 YOU'RE READY!

Your app is:
- ✅ Secure
- ✅ Functional
- ✅ Tested
- ✅ Production-ready

**Time to launch!** 🎉

Remember:
- Start small (friends/family first)
- Monitor closely
- Fix issues quickly
- Iterate based on feedback

**Good luck with your launch!** 🚀
