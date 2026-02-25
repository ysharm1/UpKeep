# 🚀 Launch Now - Simplified Checklist

## What's Already Done ✅

- ✅ Code is complete and pushed to GitHub
- ✅ Deployed to Vercel (https://up-keep-9zbu.vercel.app)
- ✅ All APIs built (job creation, lead view, lead accept)
- ✅ Frontend pages built (homeowner submission, provider marketplace)
- ✅ Stripe integration ready
- ✅ SMS integration ready (Twilio)
- ✅ Partners file configured (with example data)

## What You Need to Do (3 Things)

### 1. Fix Database (10 minutes) 🔴 BLOCKER

**Your database is paused/inaccessible.**

**Steps:**
1. Go to https://supabase.com/dashboard
2. Find your project: `umtacdslewohvlfukzua`
3. Click "Resume Project" (if paused)
4. Wait 2-3 minutes for it to start

**Then run this:**
```bash
npx prisma migrate deploy
```

**This creates the tables you need:**
- LeadView (tracks $15 payments)
- LeadAcceptance (tracks $50 payments)

**How to verify it worked:**
```bash
npx prisma studio
```
You should see LeadView and LeadAcceptance tables.

---

### 2. Add Twilio (Optional but Recommended) (15 minutes)

**Without Twilio:** SMS will log to console (you can see in Vercel logs)
**With Twilio:** Vendors get real SMS notifications

**Steps:**
1. Go to https://twilio.com/try-twilio
2. Sign up (free trial gives you $15 credit)
3. Get a phone number (costs $1/month after trial)
4. Copy these 3 things:
   - Account SID (starts with AC...)
   - Auth Token
   - Phone Number (format: +1234567890)

5. Add to Vercel:
   - Go to https://vercel.com/dashboard
   - Your project → Settings → Environment Variables
   - Add 3 variables:
     ```
     TWILIO_ACCOUNT_SID = ACxxxxx...
     TWILIO_AUTH_TOKEN = xxxxx...
     TWILIO_PHONE_NUMBER = +1234567890
     ```
   - Click "Redeploy" at the top

**Test it:**
- Submit a test job
- Check Vercel logs
- Should see: "✅ SMS sent to partner: ABC HVAC"

---

### 3. Replace Example Vendors with Real Ones (30 minutes)

**Current state:** `lib/partners.ts` has 3 fake vendors

**What you need:**
- Call 3 HVAC companies in your area
- Get them to agree to the model
- Get their info

**Pitch script:**
> "Hey, I run a lead generation service for HVAC companies. I send you qualified leads - homeowners who need HVAC repair right now. You pay $15 to see the lead details, and if you want it, you pay $50 to accept it exclusively. Average job is $300-500, so you're paying $65 to get a $300+ job. Interested?"

**Info you need from each:**
- Business name
- Email (for their account)
- Phone number (for SMS notifications)
- Service area (city, radius)

**Update `lib/partners.ts`:**
```typescript
export const PARTNERS: Partner[] = [
  {
    id: 'partner-1',
    name: 'Real Company Name', // ← Change this
    email: 'real@email.com', // ← Change this
    phone: '+14805551234', // ← Change this (MUST be +1 format)
    categories: ['hvac'],
    serviceArea: {
      city: 'Phoenix', // ← Change to your city
      state: 'AZ',
      radius: 25,
    },
    active: true,
    viewFee: 15,
    acceptFee: 50,
  },
  // Add 2 more real vendors
]
```

**Then:**
```bash
git add lib/partners.ts
git commit -m "Add real vendors"
git push origin main
```

Vercel will auto-deploy in 1-2 minutes.

**Have vendors register:**
- Send them: https://up-keep-9zbu.vercel.app/auth/register?role=service_provider
- They MUST use the SAME email as in partners.ts

---

## Test Before Running Ads (30 minutes)

### Test Flow:

**1. Submit a test lead:**
- Go to https://up-keep-9zbu.vercel.app/auth/register
- Register as homeowner
- Go to /problems/new
- Submit: "AC not cooling, blowing hot air"

**2. Check if it worked:**
- Go to Vercel logs: https://vercel.com/dashboard → Your project → Logs
- Look for: "📢 Broadcasting lead to 3 partners via SMS"
- Look for: "✅ SMS sent to partner: [name]"

**3. Test as vendor:**
- Register as service_provider (use email from partners.ts)
- Login
- Go to /provider/leads
- Click on the test lead
- Click "Pay $15 to View"
- Use test card: `4242 4242 4242 4242`
- Verify full details shown
- Click "Accept This Lead - $50"
- Use test card again
- Verify customer contact shown

**If all works:** You're ready to launch ads! 🎉

**If something fails:** Check Vercel logs for errors

---

## Launch Google Ads (30 minutes)

**Once testing passes:**

1. Go to https://ads.google.com
2. Create new campaign
3. Settings:
   - Goal: "Get more leads"
   - Campaign type: "Search"
   - Location: Your city + 25 miles
   - Budget: $20/day
4. Keywords (copy these):
   ```
   "hvac repair near me"
   "ac not working"
   "ac repair near me"
   "furnace not working"
   "emergency hvac repair"
   "ac not cooling"
   ```
5. Ad copy:
   - Headline 1: AC Not Working? Get Help Fast
   - Headline 2: 3 Local Pros Compete For You
   - Headline 3: 100% FREE For Homeowners
   - Description: Submit your HVAC problem and get quotes from 3 verified local pros. No obligation, completely free.
6. Final URL: `https://up-keep-9zbu.vercel.app/problems/new`
7. Launch!

---

## What to Expect (First Week)

**Day 1:**
- 2-5 clicks
- 0-1 leads
- Check Vercel logs constantly
- Fix any bugs immediately

**Week 1:**
- 10-20 clicks
- 2-4 leads
- 1-2 vendors viewing leads
- 0-1 accepted leads
- Revenue: $0-95

**This is normal!** First week is testing and learning.

---

## Monitoring Checklist

**Check these daily:**
- [ ] Vercel logs (any errors?)
- [ ] Google Ads dashboard (clicks, cost)
- [ ] Vendor responses (are they viewing leads?)
- [ ] Lead quality (are homeowners real?)

**Check these weekly:**
- [ ] Conversion rate (clicks → submissions)
- [ ] Vendor satisfaction (are they happy?)
- [ ] ROI (revenue vs ad spend)

---

## Quick Reference

**Your URLs:**
- Website: https://up-keep-9zbu.vercel.app
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard
- Google Ads: https://ads.google.com
- Twilio: https://twilio.com/console

**Test Stripe Card:**
- Number: 4242 4242 4242 4242
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Support:**
- Vercel Logs: Check for errors
- Stripe Dashboard: Check payments
- Twilio Console: Check SMS delivery

---

## You're Almost There!

**Total time to launch: 1-2 hours**

1. Fix database (10 min)
2. Add Twilio (15 min) - optional
3. Add real vendors (30 min)
4. Test (30 min)
5. Launch ads (30 min)

**Then monitor and optimize!**

Good luck! 🚀
