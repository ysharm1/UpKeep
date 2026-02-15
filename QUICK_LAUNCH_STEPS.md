# 🚀 Quick Launch Steps - Do This Now!

## Your 30-Minute Launch Plan

Follow these steps in order. Each should take 5-10 minutes.

---

## ✅ Step 1: Set Up Production Database (10 min)

### Go to Supabase

1. Open: https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub
4. Click "New Project"
5. Fill in:
   - Name: `upkeep-production`
   - Database Password: Click "Generate a password" (SAVE THIS!)
   - Region: `West US (North California)` (closest to you)
6. Click "Create new project"
7. Wait 2 minutes for setup

### Get Your Database URL

1. Click "Project Settings" (gear icon)
2. Click "Database" in sidebar
3. Scroll to "Connection string"
4. Select "URI" tab
5. Copy the string (looks like):
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with the password you saved
7. **SAVE THIS URL** - paste it in a note

---

## ✅ Step 2: Deploy to Vercel (10 min)

### Import Your Project

1. Open: https://vercel.com
2. Click "Add New..." → "Project"
3. Find your GitHub repo: `UpKeep`
4. Click "Import"

### Add Environment Variables

Click "Environment Variables" and add these (copy-paste):

**1. DATABASE_URL**
```
[Paste your Supabase URL from Step 1]
```

**2. JWT_SECRET**
```
[Run this in terminal: openssl rand -base64 32]
```

**3. JWT_REFRESH_SECRET**
```
[Run this in terminal again: openssl rand -base64 32]
```

**4. OPENAI_API_KEY**
```
[Copy from your .env file]
```

**5. STRIPE_SECRET_KEY**
```
[Copy from your .env file - starts with sk_test_]
```

**6. NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**
```
[Copy from your .env file - starts with pk_test_]
```

**7. NEXT_PUBLIC_APP_URL** (temporary - we'll update this)
```
https://upkeep.vercel.app
```

### Deploy!

1. Click "Deploy"
2. Wait 2-3 minutes
3. You'll see "Congratulations!" when done
4. Click "Visit" to see your live site
5. **SAVE YOUR URL** (looks like: `https://upkeep-xxxxx.vercel.app`)

---

## ✅ Step 3: Set Up Database Tables (5 min)

Your database is empty! Let's create the tables.

### In Your Terminal

```bash
# 1. Install Vercel CLI (if you haven't)
npm install -g vercel

# 2. Login
vercel login

# 3. Link your project
cd /Users/yashsharma/UpKeep\(Noncrashed\)\ 
vercel link

# When prompted:
# - Set up and deploy? → N (No)
# - Link to existing project? → Y (Yes)
# - Select your project from the list

# 4. Pull environment variables
vercel env pull .env.production

# 5. Run migrations
export $(cat .env.production | xargs)
npx prisma migrate deploy
```

You should see:
```
✓ Applying migration `20231201000000_init`
✓ Database is now in sync with schema
```

---

## ✅ Step 4: Update App URL (2 min)

1. Go back to Vercel Dashboard
2. Click your project
3. Go to Settings → Environment Variables
4. Find `NEXT_PUBLIC_APP_URL`
5. Click "Edit"
6. Change to your actual URL: `https://upkeep-xxxxx.vercel.app`
7. Click "Save"
8. Go to "Deployments" tab
9. Click "..." on latest deployment
10. Click "Redeploy"

---

## ✅ Step 5: Test Your Live App! (5 min)

### Quick Smoke Test

1. Visit your Vercel URL
2. Click "Sign Up"
3. Register as Homeowner:
   - Email: `test@youremail.com`
   - Password: `Test1234!`
   - Fill in name, phone, address
4. Click "Create account"
5. If you see the dashboard → **SUCCESS!** 🎉

### Full Test (Optional)

1. Create a problem (HVAC issue)
2. Test AI chatbot
3. Open incognito window
4. Register as Provider
5. Set diagnostic fee
6. Find and claim the job
7. Book diagnostic visit (use test card: `4242 4242 4242 4242`)

---

## 🎉 You're Live!

Your app is now running in production at:
```
https://upkeep-xxxxx.vercel.app
```

### What's Working:
- ✅ User registration & login
- ✅ Problem creation
- ✅ AI chatbot
- ✅ Provider matching
- ✅ Booking system
- ✅ Stripe payments (test mode)
- ✅ Job management

### What's Next:

**This Week:**
1. Test all features thoroughly
2. Invite 2-3 friends to test
3. Fix any bugs you find

**Next Week:**
1. Invite local service providers
2. Post in local Facebook groups
3. Get first real users

**Month 1:**
1. Collect feedback
2. Improve based on usage
3. Add most-requested features

**Month 2:**
1. Switch Stripe to live mode (real payments)
2. Launch marketing campaign
3. Scale up!

---

## Need Help?

### Common Issues:

**Build failed?**
- Check Vercel logs for errors
- Verify all environment variables are set
- Make sure GitHub repo is up to date

**Database connection error?**
- Double-check DATABASE_URL is correct
- Verify password has no special characters that need escaping
- Try connecting with TablePlus or psql

**Stripe not working?**
- Verify NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set
- Check it starts with `pk_test_`
- Look at browser console for errors

**AI chatbot not responding?**
- Check OPENAI_API_KEY is correct
- Verify OpenAI account has credits
- Look at Vercel function logs

### Get Logs:

1. Vercel Dashboard → Your Project
2. Click "Deployments"
3. Click latest deployment
4. Click "Runtime Logs"
5. See what's failing

---

## Costs

### Right Now (Test Mode):
- **Vercel**: $0 (free tier)
- **Supabase**: $0 (free tier)
- **Stripe**: $0 (test mode, no real charges)
- **OpenAI**: ~$5-10/month (pay-as-you-go)

**Total: $5-10/month**

### When You Go Live:
- Same costs until you hit 100+ users
- Then consider upgrading to paid tiers

---

## Ready to Accept Real Payments?

When you're ready (after testing):

1. **Activate Stripe Account**
   - Complete business verification
   - Add bank account

2. **Get Live Keys**
   - Stripe Dashboard → Switch to "Live mode"
   - Copy live API keys

3. **Update Vercel**
   - Replace test keys with live keys
   - Redeploy

4. **Test with Real Card**
   - Make a small test transaction
   - Verify it works

---

## 🚀 Launch Checklist

Before inviting real users:

- [ ] All features tested and working
- [ ] Stripe test payments successful
- [ ] AI chatbot responding correctly
- [ ] Email notifications working (if configured)
- [ ] Terms of service page created
- [ ] Privacy policy page created
- [ ] Support email set up
- [ ] Error monitoring configured (Sentry)
- [ ] Analytics set up (Google Analytics)

---

**You did it! Your app is live! 🎉**

Now go get some users and make this thing successful!
