# Lead Generation Platform - Setup Guide

## The Model

**Simple pay-per-lead model:**
- Homeowner submits problem: FREE
- 3 providers notified via SMS
- Each provider pays $15 to view full details
- One provider pays $50 to accept lead exclusively
- After acceptance, provider handles everything directly with customer

**Your revenue per lead:**
- 3 providers × $15 = $45 (view fees)
- 1 provider × $50 = $50 (acceptance fee)
- **Total: $95 per lead**

## Why This Model Works

**For You:**
- Predictable revenue ($95 per lead)
- No refunds or chargebacks
- Simple payment flow
- Scalable (add more partners = more revenue per lead)

**For Partners:**
- Low risk ($15 to see if lead is good)
- Fair pricing ($65 total for exclusive lead)
- High ROI (average job is $300-500, they pay $65)
- No competition after acceptance

**For Homeowners:**
- Completely FREE
- 3 companies notified immediately
- Fast response from providers
- No platform involvement after lead is accepted

## How It Works - Step by Step

### 1. Homeowner Submits Problem
- Goes to your site
- Fills out form (FREE)
- Uploads photos
- Gets AI diagnosis
- Submits request

### 2. System Broadcasts to Partners
- Finds 3 partners for that category (HVAC, plumbing, etc.)
- Sends SMS notification to all 3 simultaneously
- SMS includes: category, location, link to view details
- Creates tracking record in database

### 3. Partners View Lead
- Partner clicks SMS link
- Sees preview: category, location, brief description
- Clicks "Pay $15 to View"
- Stripe charges $15
- Full details revealed: customer name, phone, email, photos, full description

### 4. Partner Accepts Lead
- Partner clicks "Accept This Lead - $50"
- Stripe charges $50
- Lead marked as accepted, other providers notified
- Partner gets customer contact info
- Partner contacts customer directly and completes job

### 5. No Refunds
- Once a provider pays $15 to view, no refund
- Once a provider pays $50 to accept, no refund
- Simple, predictable revenue model

## Setup Steps

### 1. Sign Up 3 Partners Per Category

**Start with one category (HVAC recommended):**
- Partner 1: Established company
- Partner 2: Hungry startup
- Partner 3: Mid-size reliable

**What you need from each:**
- Business name, email, phone
- Service categories
- Service area
- Stripe account (for charging them)
- Agreement to pay-to-play model

### 2. Create Provider Accounts

Each partner needs an account:
```
https://up-keep-9zbu.vercel.app/auth/register?role=service_provider
```

They use the SAME email you'll add to `lib/partners.ts`

### 3. Add Partners to Configuration

Edit `lib/partners.ts`:

```typescript
export const PARTNERS: Partner[] = [
  {
    id: 'partner-1',
    name: 'ABC HVAC Services',
    email: 'john@abchvac.com',
    phone: '+15551234567', // Must be E.164 format
    categories: ['hvac'],
    serviceArea: {
      city: 'Phoenix',
      state: 'AZ',
      radius: 25,
    },
    active: true,
    viewFee: 15,  // Pay to view lead
    acceptFee: 50, // Pay to accept lead
  },
  // Add 2 more partners for HVAC
  // Then add 3 partners for plumbing, etc.
]
```

### 4. Set Up Stripe for Partner Billing

**For each partner:**
1. Create Stripe customer when they register
2. Save payment method
3. System stores `stripeCustomerId` in database

**Charging flow:**
- Provider clicks "Pay $15 to View" → Charge $15 via Stripe
- Provider clicks "Accept Lead - $50" → Charge $50 via Stripe
- No refunds, no chargebacks

### 5. Deploy and Test

```bash
git add -A
git commit -m "Implement pay-to-play competitive lead model"
git push origin main
```

Test flow:
1. Create test job as homeowner
2. Verify all 3 partners get SMS
3. As provider, click SMS link
4. Pay $15 to view (test card: 4242 4242 4242 4242)
5. Verify full details shown
6. Pay $50 to accept
7. Verify other providers get "lead taken" SMS

## Revenue Projections

**Month 1 (20 leads):**
- 20 leads × 3 partners × $15 = $900
- 20 leads × $50 = $1,000
- **Total: $1,900**

**Month 3 (50 leads):**
- 50 leads × 3 partners × $15 = $2,250
- 50 leads × $50 = $2,500
- **Total: $4,750**

**Month 6 (100 leads):**
- 100 leads × 3 partners × $15 = $4,500
- 100 leads × $50 = $5,000
- **Total: $9,500/month**

## Partner Pitch

**"Here's how it works:"**

"You pay $15 to see each qualified lead. If you want the lead, you pay an additional $50 to accept it exclusively (total $65). Once you accept, you get the customer's contact info and handle everything directly with them.

The average job is worth $300-500, so you're paying $65 to get a $300+ job. That's a 4-6x ROI. Plus, you only pay $15 to see if the lead is good before committing the full $65.

No refunds, no chargebacks, no complicated booking systems. Simple and straightforward."

## Technical Implementation Status

**✅ Completed:**
- Database schema (LeadView, LeadAcceptance tables)
- Stripe integration ($15 view, $50 accept)
- SMS notifications via Twilio
- Lead view API
- Lead accept API
- Get leads API (available/viewed/won)
- Provider lead marketplace UI
- Provider dashboard with lead stats
- Job creation with SMS broadcasting

**📋 Before Launch:**
- Run database migration
- Set up Twilio account
- Add 3 real partners
- Create provider accounts
- Test end-to-end
- Deploy to productionNeeded:**
- LeadCharge table (track $25 charges per partner)
- LeadBooking table (track who booked first)
- Partner payment methods (Stripe customer IDs)

## Scaling Strategy

**Month 1: Prove it works**
- 3 HVAC partners
- 20-30 leads
- $2,000-3,000 revenue
- Focus: Get booking rate above 80%

**Month 2: Add second category**
- 3 HVAC + 3 Plumbing partners
- 40-60 leads
- $4,000-6,000 revenue
- Focus: Maintain quality, improve speed

**Month 3-6: Scale up**
- 4 categories × 3 partners = 12 partners
- 100+ leads/month
- $10,000+ revenue
- Focus: Automation, add more partners per category

## Managing Partner Quality

**Track these metrics:**
- Response time (how fast they contact customer)
- Booking rate (% of leads they win)
- Customer satisfaction
- Cancellation rate

**Remove partners who:**
- Don't respond within 2 hours
- Have booking rate < 20%
- Get customer complaints
- Cancel appointments

**Reward top performers:**
- Give them more leads (add to more categories)
- Feature them in emails
- Offer volume discounts
- Exclusive territory options

## Handling Edge Cases

**What if 2 partners book at same time?**
- First timestamp wins
- Or split the lead (both pay $37.50 extra)

**What if customer doesn't respond to anyone?**
- Still counts as "no booking"
- Refund all partners
- Follow up with customer

**What if partner books but customer cancels?**
- Partner still pays (they booked first)
- Or offer one-time refund for goodwill
- Track cancellation rates

**What if customer complains about a partner?**
- Investigate immediately
- Refund customer if needed
- Warn or remove partner
- Quality control is critical

## Next Steps

1. **Find 3 HVAC partners** in your area
2. **Pitch them** the pay-to-play model
3. **Get them registered** and added to config
4. **Set up Stripe** for partner billing
5. **Test the flow** end-to-end
6. **Start marketing** to homeowners (it's FREE for them!)
7. **Monitor booking rates** and partner quality
8. **Scale to more categories** once proven

## Success Metrics

**Week 1:**
- 3 partners signed up
- 5-10 test leads sent
- 80%+ booking rate
- Partners respond within 1 hour

**Month 1:**
- 20-30 leads sent
- $2,000+ revenue
- 3 happy partners
- Positive customer feedback

**Month 3:**
- 50+ leads/month
- $5,000+ revenue
- 6-9 partners (2-3 categories)
- Automated billing working

Your job is now 100% marketing to homeowners. The platform handles partner competition automatically.
