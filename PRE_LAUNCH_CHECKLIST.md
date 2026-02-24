# Pre-Launch Checklist - DO THESE BEFORE RUNNING ADS

## ❌ BLOCKERS (Must Fix First)

### 1. Database Connection Issue
**Problem:** Can't connect to Supabase database
**Error:** `Can't reach database server at db.umtacdslewohvlfukzua.supabase.co:5432`

**How to Fix:**
1. Go to https://supabase.com/dashboard
2. Check if your project is paused (free tier pauses after inactivity)
3. If paused, click "Resume Project"
4. Wait 2-3 minutes for database to start
5. Test connection: `npx prisma db pull`

**OR if database is deleted:**
1. Create new Supabase project
2. Copy new DATABASE_URL
3. Update `.env` file
4. Update Vercel environment variables
5. Run migrations

### 2. Missing Database Migration
**Problem:** LeadView and LeadAcceptance tables don't exist in database yet

**How to Fix (after database is accessible):**
```bash
# Create migration
npx prisma migrate dev --name add_lead_generation_tables

# Or if database is production:
npx prisma migrate deploy
```

**What this does:**
- Creates LeadView table (tracks $15 payments)
- Creates LeadAcceptance table (tracks $50 payments)
- Adds leadStatus, acceptedBy, acceptedAt, viewCount to JobRequest
- Adds stripeCustomerId, totalLeadsViewed, totalLeadsAccepted, totalSpent to ServiceProviderProfile

---

## ⚠️ REQUIRED SETUP (Do After Database Fixed)

### 3. Set Up Twilio for SMS
**Status:** Not configured (will log to console instead)

**Steps:**
1. Sign up at https://twilio.com
2. Get a phone number ($1/month)
3. Copy these credentials:
   - Account SID
   - Auth Token
   - Phone Number

4. Add to Vercel:
   - Go to https://vercel.com/dashboard
   - Your project → Settings → Environment Variables
   - Add:
     - `TWILIO_ACCOUNT_SID` = ACxxxxx...
     - `TWILIO_AUTH_TOKEN` = xxxxx...
     - `TWILIO_PHONE_NUMBER` = +1234567890
   - Redeploy

5. Test:
   - Submit a test job
   - Check if SMS sent to vendors

**Without Twilio:**
- SMS will log to console (Vercel logs)
- Vendors won't get notified
- You'll have to manually tell them about leads

### 4. Add Real Vendors to System
**Status:** Need 3 vendors minimum

**Current partners.ts:**
```typescript
// lib/partners.ts - probably empty or has dummy data
```

**What you need:**

**Step 1: Find 3 HVAC companies**
- Google "HVAC repair [your city]"
- Call them
- Pitch: "$15 to view leads, $50 to accept. Average job is $300-500."

**Step 2: Get their info:**
- Business name
- Email
- Phone number (for SMS, must be E.164 format: +14805551234)
- Service area (city, radius)

**Step 3: Add to `lib/partners.ts`:**
```typescript
export const PARTNERS: Partner[] = [
  {
    id: 'partner-1',
    name: 'ABC HVAC',
    email: 'john@abchvac.com',
    phone: '+14805551234', // MUST be E.164 format
    categories: ['hvac'],
    serviceArea: {
      city: 'Phoenix',
      state: 'AZ',
      radius: 25,
    },
    active: true,
    viewFee: 15,
    acceptFee: 50,
  },
  {
    id: 'partner-2',
    name: 'XYZ Heating & Cooling',
    email: 'mike@xyzheating.com',
    phone: '+14805555678',
    categories: ['hvac'],
    serviceArea: {
      city: 'Phoenix',
      state: 'AZ',
      radius: 25,
    },
    active: true,
    viewFee: 15,
    acceptFee: 50,
  },
  {
    id: 'partner-3',
    name: '123 HVAC Services',
    email: 'sarah@123hvac.com',
    phone: '+14805559012',
    categories: ['hvac'],
    serviceArea: {
      city: 'Phoenix',
      state: 'AZ',
      radius: 25,
    },
    active: true,
    viewFee: 15,
    acceptFee: 50,
  },
]
```

**Step 4: Have them register:**
- Send them: https://up-keep-9zbu.vercel.app/auth/register?role=service_provider
- They MUST use the SAME email as in partners.ts

**Step 5: Commit and deploy:**
```bash
git add lib/partners.ts
git commit -m "Add 3 HVAC vendors"
git push origin main
```

Vercel will auto-deploy.

---

## ✅ TESTING (Do Before Running Ads)

### 5. End-to-End Test Flow

**Test as Homeowner:**
1. Go to https://up-keep-9zbu.vercel.app/auth/register
2. Register as homeowner
3. Go to /problems/new
4. Submit a test problem:
   - Category: HVAC
   - Description: "AC not cooling, blowing hot air"
   - Location: Your city
5. Submit

**Check Backend:**
1. Go to Vercel dashboard → Your project → Logs
2. Look for: "📢 Broadcasting lead to 3 partners via SMS"
3. Look for: "✅ SMS sent to partner: ABC HVAC"
4. If you see errors, fix them

**Test as Vendor:**
1. Register as service_provider (use email from partners.ts)
2. Login
3. Go to /provider/leads
4. You should see the test lead in "Available" tab
5. Click on it
6. Click "Pay $15 to View"
7. Use test card: 4242 4242 4242 4242
8. Verify full details shown
9. Click "Accept This Lead - $50"
10. Use test card again
11. Verify customer contact info shown

**Check Database:**
```sql
-- Check if lead view was recorded
SELECT * FROM "LeadView" ORDER BY "viewedAt" DESC LIMIT 5;

-- Check if lead acceptance was recorded
SELECT * FROM "LeadAcceptance" ORDER BY "acceptedAt" DESC LIMIT 5;

-- Check job status
SELECT id, category, "leadStatus", "acceptedBy", "viewCount" 
FROM "JobRequest" 
ORDER BY "createdAt" DESC LIMIT 5;
```

**If ANY step fails, DON'T run ads yet.**

---

## 🚀 READY TO LAUNCH

### Checklist Before Running Ads:

- [ ] Database is accessible
- [ ] Migration ran successfully (LeadView and LeadAcceptance tables exist)
- [ ] Twilio is configured (or you're okay with console logging)
- [ ] 3 real vendors added to partners.ts
- [ ] 3 vendors registered accounts
- [ ] Test lead submitted successfully
- [ ] Test vendor received SMS (or saw in logs)
- [ ] Test vendor can view lead for $15
- [ ] Test vendor can accept lead for $50
- [ ] Stripe test payments work
- [ ] Database records created correctly

**If all checked:** You're ready to run Google Ads!

**If any unchecked:** Fix it first, or you'll waste ad money.

---

## 📊 What to Monitor After Launch

### Day 1:
- Check Vercel logs every hour
- Make sure leads are being created
- Make sure SMS are being sent
- Make sure vendors are responding

### Week 1:
- Track conversion rate (clicks → submissions)
- Track vendor response rate
- Track lead quality
- Adjust ad copy if needed

### Month 1:
- Calculate ROI (revenue vs ad spend)
- Add more vendors if needed
- Scale budget if profitable
- Add more categories (plumbing, electrical)

---

## 🆘 Common Issues

### "No vendors found for category"
- Check partners.ts has vendors for that category
- Check vendors are marked as active: true
- Check serviceArea matches job location

### "SMS not sending"
- Check Twilio credentials in Vercel
- Check phone numbers are E.164 format (+1234567890)
- Check Twilio account has credits
- Check Vercel logs for errors

### "Payment failed"
- Check Stripe keys in Vercel
- Check using test mode keys with test cards
- Check provider has stripeCustomerId
- Check Stripe dashboard for errors

### "Lead not showing for vendor"
- Check vendor's specialties match job category
- Check vendor hasn't already viewed the lead
- Check lead status is 'available' or 'viewed'
- Check vendor is logged in correctly

---

## 💰 Expected Results (First Month)

**With $600 ad spend ($20/day):**
- 60-120 clicks
- 10-20 leads submitted
- 3-6 leads viewed by vendors ($45-90 revenue)
- 1-3 leads accepted ($50-150 revenue)
- **Total revenue: $95-240**
- **ROI: -60% to -80% (expected first month)**

**Why negative ROI first month?**
- Testing and learning
- Optimizing keywords
- Improving conversion rate
- Building vendor relationships

**Month 2-3 should be profitable (3x ROI)**

---

## Next Steps

1. **Fix database connection** (check Supabase)
2. **Run migration** (create tables)
3. **Set up Twilio** (or accept console logging)
4. **Add 3 vendors** (call HVAC companies)
5. **Test everything** (end-to-end flow)
6. **Launch ads** (start with $20/day)
7. **Monitor and optimize** (daily for first week)

**Estimated time: 4-6 hours total**

Good luck! 🚀
