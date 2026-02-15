# Operations Playbook - Week 1

## Daily Checklist (3-4 hours/day)

### Morning (1 hour)
- [ ] Check admin dashboard for new bookings
- [ ] Verify all providers have set diagnostic fees
- [ ] Check for pending responses (>4 hours old)
- [ ] Reassign jobs with no provider response
- [ ] Review failed payments and retry

### Noon (1 hour)
- [ ] Follow up with slow providers (phone/text)
- [ ] Check pending quotes (need homeowner approval)
- [ ] Respond to support messages
- [ ] Update provider on any issues

### Evening (1 hour)
- [ ] Check completed jobs
- [ ] Verify payment captures
- [ ] Review provider performance
- [ ] Plan next day priorities

### As Needed (30 min - 1 hour)
- [ ] Handle urgent issues
- [ ] Provider cancellations
- [ ] Payment disputes
- [ ] Customer complaints

---

## Provider Onboarding Script

### Phone Call (15-20 minutes)

**Introduction:**
"Hi [Name], thanks for signing up for UpKeep. I'm [Your Name], the founder. I wanted to personally walk you through how it works and answer any questions."

**Set Expectations:**
1. **Response Time:** "When you get a booking, we need you to respond within 4 hours. If you can't make it, let us know ASAP so we can reassign."

2. **Diagnostic Fee:** "You'll set a diagnostic visit fee ($50-150). This is what homeowners pay upfront for you to come diagnose the problem. After you inspect, you submit a repair quote."

3. **Payment:** "You get paid 85% of the total (diagnostic + repair). We keep 15% as a platform fee. Payment is captured when you mark the job complete."

4. **Cancellations:** "If you need to cancel, let us know immediately. Too many cancellations and we'll have to pause your account."

**Walk Through Platform:**
1. Show them how to set diagnostic fee
2. Show them how bookings appear
3. Show them how to submit repair quotes
4. Show them how to mark jobs complete

**Get Contact Info:**
- Cell phone (for urgent issues)
- Preferred contact method
- Availability hours

**End Call:**
"Any questions? Great. I'll send you a test booking so you can see how it works. Looking forward to working with you!"

---

## Issue Resolution Playbook

### Provider Doesn't Respond (>4 hours)

**Action:**
1. Check admin dashboard for pending responses
2. Call/text provider: "Hey [Name], you have a booking from [Homeowner]. Can you respond in the next hour?"
3. If no response in 1 hour → Reassign to next provider
4. Log incident in spreadsheet

**If Happens 3+ Times:**
- Call provider: "We've noticed slow response times. Is everything okay?"
- If continues → Pause account

### Provider Cancels

**Action:**
1. Call homeowner immediately: "Hi [Name], unfortunately [Provider] had to cancel. I'm reassigning you to another provider right now."
2. Reassign to next available provider
3. Offer discount if homeowner is frustrated: "I'll apply a $10 credit to your diagnostic fee."
4. Log incident

**If Happens 3+ Times:**
- Remove provider from platform

### Payment Fails

**Action:**
1. Check Stripe dashboard for error
2. If card declined → Contact homeowner: "Your payment didn't go through. Can you update your payment method?"
3. If Stripe error → Retry payment
4. If still fails → Use admin tool to force capture or refund

### Homeowner Disputes Charge

**Action:**
1. Review job details
2. Call homeowner: "I see you disputed the charge. Can you tell me what happened?"
3. Call provider: "Homeowner disputed. What's your side?"
4. Make judgment call:
   - If provider at fault → Issue refund
   - If homeowner unreasonable → Explain and stand firm
   - If unclear → Partial refund (50%)

### Provider Submits Inflated Quote

**Action:**
1. Review quote (labor + parts)
2. If seems high → Call provider: "This quote seems high. Can you break it down?"
3. If justified → Let it go
4. If not justified → Ask provider to revise
5. If pattern → Remove provider

---

## Provider Performance Tracking

### Spreadsheet Template

| Provider | Response Time Avg | Cancellation Rate | Completion Rate | Reliability Score | Status |
|----------|------------------|-------------------|-----------------|-------------------|--------|
| John's HVAC | 2 hours | 0% | 100% | 95 | Active |
| Quick Fix | 6 hours | 10% | 90% | 70 | Warning |
| Pro Plumbing | 1 hour | 0% | 100% | 98 | Active |

**Update weekly.**

### Reliability Tiers (Manual for Week 1)

**Gold (95-100):**
- <2hr response
- 0% cancellation
- 100% completion
- Priority for new bookings

**Silver (80-94):**
- <4hr response
- <5% cancellation
- >95% completion
- Normal priority

**Bronze (60-79):**
- <24hr response
- <10% cancellation
- >90% completion
- Low priority

**Inactive (<60):**
- Pause account
- Call to discuss improvement

---

## Homeowner Support FAQ

### "When will I be charged?"

"Your diagnostic fee ($89) is authorized when you book, but not charged until the provider visits. If you approve the repair quote, that's authorized too. Both charges are captured when the provider marks the job complete."

### "Can I cancel?"

"Yes, you can cancel anytime before the provider arrives. Just let us know and we'll cancel the authorization. No charge."

### "What if I don't like the repair quote?"

"You can decline it. You'll only be charged the diagnostic fee ($89) for the provider's time to come diagnose the problem."

### "What if the provider doesn't show up?"

"That's unacceptable. We'll immediately reassign you to another provider and apply a $10 credit to your diagnostic fee. We also track provider reliability and remove unreliable providers."

### "What if the repair doesn't fix the problem?"

"Contact us immediately. We'll work with the provider to make it right. If they can't fix it, we'll issue a refund for the repair portion."

---

## Week 1 Goals

### Provider Side
- [ ] Onboard 5 providers (phone calls)
- [ ] Get all 5 to set diagnostic fees
- [ ] Get all 5 to complete test booking
- [ ] Track response times manually

### Homeowner Side
- [ ] Get 10 bookings
- [ ] 80%+ conversion to completed jobs
- [ ] <10% cancellation rate
- [ ] No payment failures

### Operations
- [ ] Respond to all issues within 1 hour
- [ ] Document all issues in spreadsheet
- [ ] Create FAQ based on common questions
- [ ] Identify biggest pain points

---

## What to Document

### Every Issue
- Date/time
- Provider/homeowner involved
- What happened
- How you resolved it
- How long it took
- How to prevent next time

### Every Provider Call
- Provider name
- Date/time
- Reason for call
- Outcome
- Follow-up needed

### Every Support Request
- Homeowner name
- Issue
- Resolution
- Time to resolve

**Why:** This data will tell you:
- What to automate first
- What to add to FAQ
- What to improve in onboarding
- What to build next

---

## Week 2-4 Priorities

Based on Week 1 data, build:

1. **Most common issue** → Automate
2. **Most time-consuming task** → Automate or delegate
3. **Most frequent question** → Add to FAQ/UI

Example:
- If providers are slow to respond → Build auto-expiration
- If homeowners ask about charges → Add payment timeline to UI
- If you're manually reassigning jobs → Build one-click reassign

---

## When to Hire Help

### Signals You Need Help
- Spending >4 hours/day on operations
- Missing issues because too busy
- Providers complaining about slow response
- Homeowners complaining about support

### First Hire: Part-Time Operations Assistant
**Role:** Handle day-to-day operations
**Tasks:**
- Provider onboarding calls
- Monitor response times
- Reassign slow jobs
- Handle basic support
- Update tracking spreadsheet

**Cost:** $15-20/hour, 20 hours/week = $300-400/week
**When:** After 50 bookings/month or 4+ hours/day on ops

---

## The Honest Truth

**Week 1 will be hard.**

You'll be:
- Coding bugs
- Onboarding providers
- Handling support
- Monitoring operations
- Fixing payment issues

**That's normal.**

By Week 4, you'll have:
- Playbooks for common issues
- Reliable providers
- Basic automation
- Clear operational rhythm

**The question is: Can you survive Week 1?**

If yes → You have a business
If no → You have a nice codebase

---

## Emergency Contacts Template

Keep this handy:

### Providers
| Name | Phone | Email | Specialty | Response Time |
|------|-------|-------|-----------|---------------|
| John | (555) 123-4567 | john@hvac.com | HVAC | 2 hours |
| Sarah | (555) 234-5678 | sarah@plumbing.com | Plumbing | 1 hour |

### Key Homeowners (Beta Users)
| Name | Phone | Email | Job ID |
|------|-------|-------|--------|
| Mike | (555) 345-6789 | mike@email.com | #001 |

### Support Resources
- Stripe Support: https://support.stripe.com
- Vercel Support: https://vercel.com/support
- Your Phone: [Your Number]
- Your Email: [Your Email]

---

## Final Checklist Before Launch

- [ ] Admin dashboard works
- [ ] Can reassign jobs manually
- [ ] Can retry payments manually
- [ ] Can issue refunds manually
- [ ] Have 5 providers onboarded
- [ ] Have provider contact info
- [ ] Have support FAQ ready
- [ ] Have issue tracking spreadsheet
- [ ] Have emergency contacts list
- [ ] Have 3-4 hours/day blocked for operations

**If all checked → You're ready to launch.**

**If not → Don't launch yet.**

The code is the easy part. The operations is the hard part.
