# UpKeep - Lead Generation Platform

A lead generation platform for home repair services. Homeowners submit problems for FREE, and service providers pay to view and accept exclusive leads.

## Business Model

**For Homeowners:**
- Submit home repair problems completely FREE
- Get AI-powered diagnosis instantly
- 3 local pros notified about your problem
- Fast response from competing providers

**For Service Providers:**
- Pay $15 to view each qualified lead
- Pay $50 to accept lead exclusively
- Get customer contact info immediately
- Average job worth $300-500 (4-6x ROI)

**Revenue Model:**
- 3 providers × $15 = $45 (view fees)
- 1 provider × $50 = $50 (acceptance fee)
- **Total: $95 per lead**

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL (Supabase)
- **Payments:** Stripe
- **SMS:** Twilio
- **AI:** OpenAI GPT-4
- **Deployment:** Vercel

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── leads/         # Lead view/accept APIs
│   │   └── jobs/          # Job creation API
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Homeowner dashboard
│   ├── provider/          # Provider dashboard & lead marketplace
│   ├── problems/          # Problem submission
│   └── messages/          # Messaging system
├── lib/                   # Shared utilities
│   ├── partners.ts        # Partner configuration
│   ├── stripe.ts          # Stripe payment integration
│   ├── sms.ts             # Twilio SMS notifications
│   └── email.ts           # Email notifications (backup)
├── prisma/                # Database schema
│   └── schema.prisma      # LeadView, LeadAcceptance tables
└── .kiro/specs/           # Feature specifications
    └── lead-generation-platform/
```

## Key Files

- `lib/partners.ts` - Configure your service provider partners
- `lib/stripe.ts` - Stripe payment integration ($15 view, $50 accept)
- `lib/sms.ts` - Twilio SMS notifications
- `app/api/leads/[id]/view/route.ts` - Lead view payment API
- `app/api/leads/[id]/accept/route.ts` - Lead acceptance payment API
- `app/api/jobs/route.ts` - Lead broadcasting logic
- `app/provider/leads/page.tsx` - Provider lead marketplace
- `app/page.tsx` - Homeowner-focused landing page

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"

# Stripe (for provider billing)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Twilio (for SMS notifications)
TWILIO_ACCOUNT_SID="ACxxxxx..."
TWILIO_AUTH_TOKEN="xxxxx..."
TWILIO_PHONE_NUMBER="+1234567890"

# OpenAI (for AI diagnosis)
OPENAI_API_KEY="sk-..."

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Set Up Database

```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Configure Partners

Edit `lib/partners.ts` and add your service provider partners:

```typescript
export const PARTNERS: Partner[] = [
  {
    id: 'partner-1',
    name: 'ABC HVAC Services',
    email: 'john@abchvac.com',
    phone: '+15551234567', // E.164 format
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
  // Add 2 more partners for competition
]
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## How It Works

### 1. Homeowner Flow
1. Visit site and submit problem (FREE)
2. Upload photos, describe issue
3. Get instant AI diagnosis
4. System broadcasts to 3 matching providers
5. Wait for providers to contact them

### 2. Provider Flow
1. Receive SMS: "New HVAC lead in Phoenix - Pay $15 to view"
2. Click link to see preview (category, location, brief description)
3. Click "Pay $15 to View" → See full details (name, phone, email, photos)
4. Click "Accept This Lead - $50" → Get exclusive access
5. Contact customer directly and complete the job

### 3. Platform Flow
1. Homeowner submits → Create JobRequest in database
2. Find 3 providers matching category and location
3. Send SMS to all 3 providers via Twilio
4. Provider pays $15 → Charge via Stripe, show full details
5. Provider pays $50 → Charge via Stripe, mark lead as accepted
6. Notify other providers that lead was taken
7. Track revenue: $45 from views + $50 from acceptance = $95

## Revenue Projections

**Month 1 (20 leads):**
- View fees: 20 × 3 × $15 = $900
- Accept fees: 20 × $50 = $1,000
- **Total: $1,900/month**

**Month 3 (50 leads):**
- View fees: 50 × 3 × $15 = $2,250
- Accept fees: 50 × $50 = $2,500
- **Total: $4,750/month**

**Month 6 (100 leads):**
- View fees: 100 × 3 × $15 = $4,500
- Accept fees: 100 × $50 = $5,000
- **Total: $9,500/month**

## Deployment

### Deploy to Vercel

```bash
vercel --prod
```

### Configure Production Environment

Set all environment variables in Vercel dashboard:
- Database URL (production)
- Stripe live keys
- Twilio credentials
- OpenAI API key
- Production app URL

## Implementation Status

### ✅ Completed Features

- Database schema (LeadView, LeadAcceptance tables)
- Stripe integration ($15 view, $50 accept)
- Twilio SMS notifications
- Lead view API
- Lead accept API
- Get leads API (available/viewed/won)
- Provider lead marketplace UI
- Provider dashboard with lead stats
- Job creation with SMS broadcasting

### 📋 Before Launch

- [ ] Run database migration: `npx prisma migrate deploy`
- [ ] Set up Twilio account and add credentials
- [ ] Add 3 real service provider partners to `lib/partners.ts`
- [ ] Create provider accounts for each partner
- [ ] Test end-to-end flow with Stripe test mode
- [ ] Switch to Stripe live mode
- [ ] Deploy to Vercel
- [ ] Start marketing to homeowners

## Documentation

- `FINAL_STATUS.md` - Complete implementation status and launch guide
- `LEAD_GENERATION_SETUP.md` - Detailed setup guide
- `GTM_STRATEGY.md` - Go-to-market strategy
- `.kiro/specs/lead-generation-platform/` - Feature specifications

## Testing

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

Test flow:
1. Create homeowner account and submit job
2. Create 3 provider accounts (use partner emails)
3. Check SMS notifications (or console logs)
4. As provider, go to `/provider/leads`
5. Pay $15 to view lead (test card)
6. Pay $50 to accept lead (test card)
7. Verify database records created

## Support

For questions or issues, open an issue on GitHub.

## License

Proprietary - All rights reserved
