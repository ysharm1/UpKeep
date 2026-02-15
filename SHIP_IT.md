# Ship It - No BS Launch Plan

## Your Only Mission

**STOP. Before you build anything:**

Answer this question:
> How many property managers do you personally know or can reach within 30 days?

**If 5+:** Read [GTM_STRATEGY.md](./GTM_STRATEGY.md) - Property manager first
**If 1-4:** Hybrid approach - Start with PMs, add homeowners Month 2
**If 0:** Homeowner first (riskier) or pivot to SaaS

**Read [DECISION_FRAMEWORK.md](./DECISION_FRAMEWORK.md) now.**

---

## Once You've Decided Your Customer

Finish the 8 endpoints. Finish Stripe capture. Test end-to-end. Ship.

---

## Critical Payment Flow Change

### ❌ OLD (Risky)
```
Book → Authorize diagnostic + repair
Complete → Capture both
```

### ✅ NEW (MVP)
```
1. Book → Authorize diagnostic ($89)
2. Visit → Capture diagnostic
3. Submit quote → Authorize repair ($320)
4. Approve → Repair authorized
5. Complete → Capture repair
```

**Why:** Less friction. No pre-auth before visit. More natural flow.

---

## The 8 Endpoints (In Order)

**But first: Choose your killer promise (30 minutes)**

Your product needs ONE clear emotional hook. Pick one:

1. **Speed:** "24-hour guaranteed response" (HIGH operational burden)
2. **Trust:** "Verified pros only" (MEDIUM operational burden)
3. **Transparency:** "Know the cost upfront" (LOW operational burden) ← **RECOMMENDED**

**For MVP, choose Transparency:**
- Already built into your flow
- Low operational burden
- Addresses real pain (surprise costs)
- Easy to communicate

**Update landing page copy:**
```
Hero: "Transparent home repair pricing. Know what you'll pay."
Subhead: "Book a $89 diagnostic visit. Get repair quote on-site. Approve before work starts."
```

**Time: 30 minutes (copy changes only)**

---

### 1. Set Diagnostic Fee
`PUT /api/providers/[id]/diagnostic-fee`
- Provider sets $50-150
- Store in database
- **Time: 30 min**

### 2. Find Nearby Providers
`GET /api/providers/nearby?lat=&lng=&category=`
- Query by specialty + location
- Return top 5 with diagnostic fees
- **Time: 1 hour**

### 3. Book Diagnostic Visit
`POST /api/bookings`
- Create Stripe PaymentIntent (authorize only)
- Store payment intent ID
- Update job status
- **Time: 1.5 hours**

### 4. Capture Diagnostic Payment
`POST /api/jobs/[id]/capture-diagnostic`
- Provider captures after visit
- Stripe capture call
- Update status
- **Time: 45 min**

### 5. Submit Repair Quote
`POST /api/jobs/[id]/repair-quote`
- Provider enters labor + parts
- Save to database
- Update status
- **Time: 1 hour**

### 6. Get Repair Quote
`GET /api/jobs/[id]/repair-quote`
- Homeowner views quote
- Return quote details
- **Time: 15 min**

### 7. Approve Repair
`POST /api/jobs/[id]/approve-repair`
- Create Stripe PaymentIntent for repair (authorize only)
- Store payment intent ID
- Update quote status
- **Time: 1 hour**

### 8. Complete Job
`POST /api/jobs/[id]/complete`
- Capture repair payment
- Calculate 15% fee
- Create Payment record
- Update status
- **Time: 1 hour**

**Total: 8 hours**

---

## The Operational Reality

### This Is Not SaaS

You're building a marketplace. That means:

**Week 1:** 3-4 hours/day managing operations
- Onboard providers personally (phone calls)
- Monitor response times manually
- Reassign slow jobs
- Handle support issues

**Week 2-4:** 2-3 hours/day + building automation
- Document what breaks
- Create operational playbooks
- Add response time tracking
- Add auto-expiration

**Month 2+:** Hire operations help
- Part-time ops assistant ($300-400/week)
- They handle day-to-day
- You focus on growth

### The Hard Question

**Are you ready to be an operations manager, not just a developer?**

If YES → This can work
If NO → Pivot to pure SaaS

---

## Product Weaknesses (Be Honest)

### Weakness 1: No Strong Emotional Hook
Right now you're a "better process" product. Not faster, not cheaper, not emergency-first.

**Solution:** Choose transparency as your killer promise (already built in).

### Weakness 2: Cold Start Fragility
Your product only works if providers respond quickly and don't cancel.

**Solution:** 
- Week 1: Manage manually (onboard providers personally)
- Week 2-4: Add basic automation (response tracking, auto-expiration)
- Month 2+: Full reliability scoring

### Weakness 3: Marketplace = Operations Business
The code is 10% of the work. Operations is 90%.

**Solution:** Accept this reality. Plan for 3-4 hours/day on operations. Hire help at Month 2.

**Read PRODUCT_WEAKNESSES.md for full details.**

---

## Admin Tools (MUST HAVE)

You WILL need these during beta:

### Admin Dashboard
`/admin` - Daily operations view:
- New bookings (need provider assignment)
- Pending responses (>4 hours old)
- Failed payments (need retry)
- Pending quotes (need homeowner approval)
- Completed jobs (need payout)
- Provider reliability metrics

### Admin Endpoints
- `POST /api/admin/jobs/[id]/status` - Change status manually
- `POST /api/admin/jobs/[id]/capture` - Force capture payment
- `POST /api/admin/jobs/[id]/refund` - Issue refund
- `POST /api/admin/jobs/[id]/complete` - Force complete
- `POST /api/admin/providers/[id]/reassign` - Reassign job to different provider
- `POST /api/admin/providers/[id]/toggle-active` - Activate/deactivate provider
- `POST /api/admin/payments/[id]/retry` - Retry failed payment

**Time: 3 hours**

**Why:** When things break (they will), you need to fix them without touching the database.

**Operational reality:** You'll use this dashboard 3-4 hours/day during Week 1.

---

## Launch Readiness Test

Ask yourself:

**If 5 providers and 5 homeowners signed up tomorrow, could they complete a job without you touching the database?**

If no → Not ready.
If yes → Ship.

---

## What Determines Traction (Not Your Code)

### 1. Provider Trust
- ✅ Payouts reliable?
- ✅ Fee transparent (15%)?
- ✅ Lead quality real?

### 2. Booking Friction
- ✅ No weird loading states?
- ✅ No Stripe errors?
- ✅ Clear status changes?

### 3. Quote Approval
- ✅ Clear total?
- ✅ Clear breakdown?
- ✅ Clear next step?

If these feel smooth → Launch.

---

## Testing Checklist

### Happy Path (MUST WORK)
- [ ] Homeowner books diagnostic
- [ ] Payment authorized in Stripe
- [ ] Provider captures diagnostic
- [ ] Provider submits repair quote
- [ ] Homeowner approves repair
- [ ] Repair payment authorized
- [ ] Provider completes job
- [ ] Repair payment captured
- [ ] Provider receives 85%
- [ ] Platform keeps 15%

### Failure Path (MUST NOT CRASH)
- [ ] Invalid diagnostic fee
- [ ] Stripe card declined
- [ ] Quote submission fails
- [ ] Approval fails
- [ ] Capture fails
- [ ] All show clear error messages

### Stripe Behavior (MUST BE CORRECT)
- [ ] Diagnostic authorized (not captured)
- [ ] Diagnostic captured after visit
- [ ] Repair authorized on approval
- [ ] Repair captured on completion
- [ ] Amounts calculated correctly
- [ ] No double captures

---

## Deploy When

✅ Happy path works flawlessly
✅ Failure path doesn't crash
✅ Stripe behaves correctly
✅ Admin tools exist
✅ No fatal errors in logs

**Don't wait for:**
- ❌ Perfect error messages
- ❌ Beautiful loading states
- ❌ Edge case handling
- ❌ Email notifications
- ❌ SMS alerts
- ❌ Analytics
- ❌ Mobile app

---

## The Hard Reality

Once you deploy, coding becomes 20% of your time.

You'll spend 80% on:
- Recruiting providers
- Onboarding first users
- Fixing real-world friction
- Handling weird edge cases
- Manually assisting early jobs

**Are you ready for that shift?**

---

## Your 3-Day Plan

### Day 1 (8 hours)
- [ ] Choose killer promise + update copy (30 min)
- [ ] Endpoints 1-3 (booking flow) (3.5 hours)
- [ ] Test booking with Stripe test mode
- [ ] Verify payment authorized
- [ ] Endpoints 4-5 (capture + quote) (1.75 hours)

### Day 2 (8 hours)
- [ ] Endpoints 6-8 (quote approval + completion) (3 hours)
- [ ] Admin tools + operations dashboard (3 hours)
- [ ] Test complete flow end-to-end
- [ ] Verify payments captured correctly

### Day 3 (6 hours)
- [ ] Error handling (1 hour)
- [ ] Loading states (1 hour)
- [ ] Final testing (2 hours)
- [ ] Create provider onboarding script (30 min)
- [ ] Create operational playbook (30 min)

### Day 4 (4 hours)
- [ ] Deploy to production
- [ ] Test on production
- [ ] Onboard first 2 providers (phone calls)
- [ ] Monitor logs

### Week 1 Post-Launch
- [ ] Onboard 3 more providers (phone calls)
- [ ] Monitor operations dashboard daily (3-4 hours/day)
- [ ] Manually reassign slow jobs
- [ ] Document what breaks

---

## Scope Discipline

### ✅ DO
- Finish the 8 endpoints
- Add admin tools
- Test happy path
- Test Stripe behavior
- Deploy

### ❌ DON'T
- Add inspections
- Touch commercial features
- Tweak AI prompts
- Add email notifications
- Build analytics
- Optimize performance
- Refactor code
- Add features

---

## Mental Shift Required

From:
> "I'm finishing a product."

To:
> "I'm preparing to test real-world liquidity."

Your code doesn't matter if:
- Providers don't trust you
- Homeowners don't book
- Quotes don't get approved

---

## Decision Tree

```
Stripe test flow works?
├─ Yes → Continue
└─ No → Fix only this

Quote submission works?
├─ Yes → Continue
└─ No → Fix only this

Completion capture works?
├─ Yes → Continue
└─ No → Fix only this

Fatal errors in logs?
├─ Yes → Fix only these
└─ No → DEPLOY
```

---

## The Danger Right Now

Not underbuilding.

The danger is:
- Polishing too much
- Expanding scope
- Chasing hypothetical edge cases
- Waiting for "perfect"

You're at 90%.

Ship when:
- Happy path works
- Failure path doesn't crash
- Stripe behaves correctly

---

## Final Checklist

### Before First Line of Code
- [ ] Read this document
- [ ] Understand payment flow change
- [ ] Commit to scope discipline

### Before Deployment
- [ ] 8 endpoints work
- [ ] Admin tools exist
- [ ] Happy path tested
- [ ] Stripe verified
- [ ] No fatal errors

### After Deployment
- [ ] Monitor logs hourly (first day)
- [ ] Fix only blocking issues
- [ ] Onboard providers manually
- [ ] Assist first jobs manually
- [ ] Gather real feedback

---

## Your Mission

Finish the 8 endpoints.
Add admin tools.
Test end-to-end.
Deploy.

That's it.

Everything else is distraction.

**Now go ship it. 🚀**
