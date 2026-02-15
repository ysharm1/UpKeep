# Testing & Launch Guide - UpKeep Platform

## Phase 1: Local Testing (Do This First!)

### Prerequisites
- ✅ Dev server running: `npm run dev` at http://localhost:3000
- ✅ Database running (PostgreSQL)
- ✅ Prisma Studio: `npx prisma studio` at http://localhost:5555
- ✅ All environment variables set in `.env`

### Test Scenario 1: Complete Homeowner Flow (30 minutes)

#### Step 1: Register as Homeowner
1. Go to http://localhost:3000
2. Click "Sign Up" or go to `/auth/register`
3. Fill in:
   - Email: `homeowner@test.com`
   - Password: `Test1234!`
   - Role: Homeowner
   - Name: John Doe
   - Phone: +1234567890
   - **Address:** 123 Main St, San Francisco, CA 94102
4. Click "Create account"
5. Login with credentials

#### Step 2: Create a Problem
1. Click "Report a Problem" or go to `/problems/new`
2. Select category: HVAC
3. Describe problem: "My AC is making a loud rattling noise and not cooling properly"
4. **Location should auto-fill** from your profile ✨
5. Upload photos (optional)
6. Click "Try AI First"

#### Step 3: Test AI Chatbot
1. Read AI diagnosis
2. Ask follow-up: "Is this dangerous?"
3. Ask: "Can I fix it myself?"
4. Verify AI gives intelligent responses
5. Click "I Need Professional Help"

#### Step 4: View Available Providers
1. Should see list of providers (if any exist)
2. If no providers, you'll need to create one (see Step 5)

### Test Scenario 2: Complete Provider Flow (30 minutes)

#### Step 5: Register as Provider (Use Incognito Window)
1. Open incognito/private window
2. Go to http://localhost:3000/auth/register
3. Fill in:
   - Email: `provider@test.com`
   - Password: `Test1234!`
   - Role: Service Provider
   - Business Name: "Cool Air HVAC"
   - Phone: +1987654321
4. Login

#### Step 6: Set Diagnostic Fee
1. Go to `/provider/settings`
2. Set diagnostic fee: $75
3. Set specialties: HVAC, Plumbing
4. Save

#### Step 7: Find and Claim Jobs
1. Go to `/provider/jobs/find`
2. See the job you created as homeowner
3. Filter by category: HVAC
4. Click "Claim Job"
5. Verify job disappears from available list

#### Step 8: View Dashboard
1. Go to `/provider/dashboard`
2. Verify job appears in your assigned jobs
3. Check stats are correct

### Test Scenario 3: Booking Flow (20 minutes)

#### Step 9: Book Diagnostic Visit (As Homeowner)
1. Switch back to homeowner window
2. Go to your problem → "Find Professionals"
3. Should see the provider who claimed the job
4. Click "Book Diagnostic Visit"
5. **Select date and time** in scheduling picker
6. Click "Continue to Payment"
7. Enter Stripe test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 94102)
8. Click "Confirm Booking"
9. Verify success message

#### Step 10: Verify Booking (As Provider)
1. Switch to provider window
2. Refresh dashboard
3. Verify booking appears in "Scheduled Visits"
4. Check homeowner contact info is visible

### Test Scenario 4: Payment Flow (15 minutes)

#### Step 11: Capture Diagnostic Payment
1. As provider, on dashboard
2. Find the scheduled visit
3. Click "Capture Diagnostic Payment"
4. Confirm
5. Verify success message

#### Step 12: Submit Repair Quote
1. Click "Submit Assessment" on the job
2. Fill in:
   - Labor cost: $200
   - Parts cost: $150
   - Notes: "Need to replace compressor"
3. Submit quote

#### Step 13: Approve Quote (As Homeowner)
1. Switch to homeowner window
2. Go to job details
3. See repair quote
4. Click "Approve & Pay"
5. Enter payment details (same test card)
6. Confirm

#### Step 14: Complete Job (As Provider)
1. Switch to provider window
2. Find job in "Active Jobs"
3. Click "Mark as Complete"
4. Verify payment captured
5. Check payout amount (85% of total)

### Test Scenario 5: Edge Cases (15 minutes)

#### Test 15: Address Auto-Fill
1. Register new homeowner with address
2. Create problem
3. Verify location auto-fills ✅

#### Test 16: Empty States
1. Register new provider
2. Check dashboard shows "No jobs"
3. Go to Find Jobs → should show available jobs

#### Test 17: Filters & Search
1. As provider, go to Find Jobs
2. Test category filter
3. Test search by keyword
4. Test sort by recent/oldest

#### Test 18: Error Handling
1. Try booking without selecting time
2. Try claiming already-claimed job
3. Try invalid payment card: `4000 0000 0000 0002`

---

## Phase 2: Stripe Dashboard Verification

### Check Stripe Dashboard
1. Go to https://dashboard.stripe.com/test/payments
2. Verify you see:
   - Diagnostic payment (authorized, then captured)
   - Repair payment (authorized, then captured)
3. Check amounts are correct
4. Verify platform fee (15%) is calculated

---

## Phase 3: Database Verification

### Check Prisma Studio
1. Open http://localhost:5555
2. Check tables:
   - **User**: 2 users (homeowner + provider)
   - **JobRequest**: 1 job with correct status
   - **Payment**: 2 payments (diagnostic + repair)
   - **RepairQuote**: 1 quote
   - **Address**: Homeowner address saved ✅

---

## Phase 4: Production Deployment (Vercel)

### Prerequisites
- ✅ All local testing passed
- ✅ Stripe account (production keys)
- ✅ Production database (Supabase/Neon/Railway)
- ✅ OpenAI API key
- ✅ Vercel account

### Step 1: Set Up Production Database
**Option A: Supabase (Recommended)**
1. Go to https://supabase.com
2. Create new project
3. Copy database URL
4. Format: `postgresql://postgres:[password]@[host]:5432/postgres`

**Option B: Neon**
1. Go to https://neon.tech
2. Create new project
3. Copy connection string

### Step 2: Deploy to Vercel
1. Push code to GitHub
2. Go to https://vercel.com
3. Import repository
4. Configure environment variables:
   ```
   DATABASE_URL=your_production_database_url
   JWT_SECRET=generate_random_string_32_chars
   JWT_REFRESH_SECRET=generate_random_string_32_chars
   OPENAI_API_KEY=your_openai_key
   STRIPE_SECRET_KEY=your_production_stripe_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_production_stripe_publishable_key
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
5. Deploy

### Step 3: Run Database Migrations
1. In Vercel dashboard, go to Settings → Environment Variables
2. Add all variables
3. In terminal:
   ```bash
   # Set DATABASE_URL to production
   npx prisma migrate deploy
   ```

### Step 4: Test Production
1. Go to your Vercel URL
2. Run through all test scenarios again
3. Use **production Stripe keys** (real cards or test mode)
4. Verify everything works

---

## Phase 5: Beta Launch (Soft Launch)

### Week 1: Friends & Family (5-10 users)
**Goal:** Find obvious bugs

1. Invite 2-3 homeowners you know
2. Invite 2-3 service providers you know
3. Ask them to:
   - Create accounts
   - Post real problems
   - Claim jobs
   - Complete full flow
4. Collect feedback daily
5. Fix critical bugs immediately

**What to Watch:**
- Sign-up completion rate
- Problems created
- Jobs claimed
- Bookings completed
- Payment success rate
- User complaints

### Week 2-3: Local Beta (20-50 users)
**Goal:** Validate marketplace dynamics

1. Post on local Facebook groups
2. Reach out to local contractors
3. Offer incentives:
   - Free diagnostic visits for first 10 homeowners
   - No platform fee for first month (providers)
4. Monitor closely:
   - Response times
   - Match rates (jobs claimed vs posted)
   - Completion rates
   - Quality issues

**Success Metrics:**
- 70%+ of jobs get claimed within 24 hours
- 80%+ of bookings result in completed jobs
- 4+ star average rating
- <5% payment failures

### Week 4: Iterate & Improve
1. Analyze data
2. Fix top 3 pain points
3. Add most-requested features
4. Improve onboarding based on drop-off points

---

## Phase 6: Public Launch

### Prerequisites for Public Launch
- ✅ 20+ successful completed jobs
- ✅ 10+ active providers
- ✅ <2% critical bug rate
- ✅ Payment processing 99%+ reliable
- ✅ Customer support process in place
- ✅ Terms of service & privacy policy
- ✅ Insurance/liability coverage

### Launch Checklist
- [ ] Production database backed up
- [ ] Monitoring set up (Sentry, LogRocket)
- [ ] Customer support email/chat
- [ ] Social media accounts created
- [ ] Landing page optimized
- [ ] SEO basics done
- [ ] Analytics tracking (Google Analytics)
- [ ] Email notifications working
- [ ] SMS notifications (optional)
- [ ] Referral program ready

### Marketing Channels
1. **Local SEO**
   - Google My Business
   - Yelp
   - Angie's List

2. **Paid Ads**
   - Google Ads (search: "plumber near me")
   - Facebook Ads (target homeowners 30-60)

3. **Partnerships**
   - Real estate agents
   - Property managers
   - Home warranty companies

4. **Content Marketing**
   - Blog posts (DIY tips)
   - YouTube videos
   - Local news features

---

## Common Issues & Solutions

### Issue: No providers claiming jobs
**Solution:**
- Reach out to providers directly
- Offer sign-up bonus
- Reduce platform fee temporarily
- Make job notifications more prominent

### Issue: Homeowners not booking
**Solution:**
- Simplify booking flow
- Add provider reviews/ratings
- Show response time guarantees
- Offer first-time discount

### Issue: Payment failures
**Solution:**
- Check Stripe logs
- Verify API keys
- Test with different cards
- Add better error messages

### Issue: Low completion rate
**Solution:**
- Add job reminders
- Improve provider vetting
- Add penalties for no-shows
- Better scheduling tools

---

## Monitoring & Metrics

### Daily Metrics
- New sign-ups (homeowners + providers)
- Jobs posted
- Jobs claimed
- Bookings made
- Payments processed
- Revenue (platform fees)

### Weekly Metrics
- Active users
- Job completion rate
- Average response time
- Customer satisfaction (ratings)
- Churn rate

### Monthly Metrics
- MRR (Monthly Recurring Revenue)
- CAC (Customer Acquisition Cost)
- LTV (Lifetime Value)
- Provider utilization rate
- Market penetration (% of target area)

---

## Support & Maintenance

### Daily Tasks
- Monitor error logs
- Respond to support tickets
- Check payment processing
- Review new sign-ups

### Weekly Tasks
- Analyze metrics
- Provider outreach
- Content updates
- Bug fixes

### Monthly Tasks
- Financial review
- Feature planning
- Marketing analysis
- Provider performance review

---

## Next Steps

1. **Right Now:** Complete local testing (Phase 1)
2. **This Week:** Deploy to Vercel (Phase 4)
3. **Next Week:** Beta launch with friends (Phase 5)
4. **Month 1:** Iterate based on feedback
5. **Month 2:** Public launch (Phase 6)

---

## Need Help?

- **Stripe Issues:** https://stripe.com/docs
- **Vercel Deployment:** https://vercel.com/docs
- **Database Issues:** Check Prisma logs
- **OpenAI Issues:** Check API usage dashboard

Good luck with your launch! 🚀
