# UpKeep - Home Maintenance Marketplace

Professional home maintenance and repair services with instant booking and transparent pricing.

## 🚀 Current Status

**✅ Backend Implementation Complete**
- Instant booking flow with Stripe payments
- Diagnostic fee management
- Repair quote system
- Admin operations dashboard
- Payment capture and refund system
- Provider management

**✅ Core Features Ready**
- Homeowner job submission
- AI-powered problem diagnosis
- Provider nearby search
- Instant booking with payment authorization
- Repair quote approval
- Job completion with automatic payouts
- Admin manual intervention tools

**📋 Ready for Testing & Deployment**

## 🏗️ Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Payments**: Stripe (authorize + capture flow)
- **AI**: OpenAI GPT-4
- **Deployment**: Vercel
- **Media**: AWS S3 (optional)

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get running in 5 minutes
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Complete testing instructions
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Production deployment steps
- **[EXECUTE.md](./EXECUTE.md)** - Launch strategy and execution plan
- **[SHIP_IT.md](./SHIP_IT.md)** - Product overview and go-to-market
- **[GTM_STRATEGY.md](./GTM_STRATEGY.md)** - Go-to-market strategy
- **[OPERATIONS_PLAYBOOK.md](./OPERATIONS_PLAYBOOK.md)** - Daily operations guide

## 🎯 Key Features

### For Homeowners
- Submit maintenance problems with photos
- Chat with AI for instant diagnosis
- Find verified professionals nearby
- Book diagnostic visits instantly
- Receive transparent repair quotes
- Approve quotes with one click
- Payments captured only after work is done

### For Service Providers
- Set your own diagnostic fee ($50-$150)
- Receive instant bookings
- Submit repair quotes on-site
- Get paid automatically (85% of total)
- Track all jobs in one dashboard

### For Admins
- Daily operations dashboard
- Manual status changes
- Force capture payments
- Issue refunds
- Reassign jobs
- Manage provider status
- Retry failed payments

## 💳 Payment Flow

1. **Booking**: Diagnostic fee authorized (not captured)
2. **Visit**: Provider completes diagnostic
3. **Capture Diagnostic**: Provider captures diagnostic payment
4. **Quote**: Provider submits repair quote
5. **Approval**: Homeowner approves, repair payment authorized
6. **Completion**: Provider completes work, repair payment captured
7. **Payout**: Provider receives 85%, platform keeps 15%

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your keys

# Set up database
npx prisma migrate dev
npx prisma generate

# Start development server
npm run dev
```

Visit http://localhost:3000

See [QUICK_START.md](./QUICK_START.md) for detailed instructions.

## 🧪 Testing

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for complete testing flows.

## 📦 Deployment

Deploy to Vercel in minutes:

1. Connect GitHub repository
2. Add environment variables
3. Deploy
4. Run database migrations

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for step-by-step instructions.

## 🗂️ Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── admin/        # Admin endpoints
│   │   ├── auth/         # Authentication
│   │   ├── bookings/     # Instant booking
│   │   ├── jobs/         # Job management
│   │   └── providers/    # Provider management
│   ├── admin/            # Admin dashboard
│   ├── auth/             # Auth pages
│   ├── dashboard/        # User dashboard
│   ├── jobs/             # Job pages
│   ├── problems/         # Problem submission
│   └── provider/         # Provider pages
├── lib/                   # Business logic
│   ├── auth/             # Auth services
│   ├── jobs/             # Job services
│   ├── payments/         # Payment services
│   └── providers/        # Provider services
├── prisma/               # Database
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Migration history
└── .kiro/specs/          # Feature specifications
```

## 🔑 Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `STRIPE_SECRET_KEY` - Stripe API key
- `OPENAI_API_KEY` - OpenAI API key

Optional:
- `AWS_ACCESS_KEY_ID` - For media uploads
- `AWS_SECRET_ACCESS_KEY` - For media uploads
- `SMTP_*` - For email notifications

See `.env.example` for complete list.

## 📊 Database Schema

Key models:
- `User` - Homeowners, providers, admins
- `HomeownerProfile` - Homeowner details
- `ServiceProviderProfile` - Provider details with diagnostic fee
- `JobRequest` - Maintenance jobs
- `RepairQuote` - Repair quotes from providers
- `Payment` - Payment records with platform fees
- `Message` - Chat messages

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Jobs
- `GET /api/jobs` - List jobs
- `GET /api/jobs/[id]` - Get job details
- `POST /api/jobs/[id]/repair-quote` - Submit repair quote
- `POST /api/jobs/[id]/approve-repair` - Approve repair quote
- `POST /api/jobs/[id]/capture-diagnostic` - Capture diagnostic payment
- `POST /api/jobs/[id]/complete` - Complete job

### Bookings
- `POST /api/bookings` - Book diagnostic visit

### Providers
- `GET /api/providers/nearby` - Find nearby providers
- `PUT /api/providers/[id]/diagnostic-fee` - Set diagnostic fee

### Admin
- `PUT /api/admin/jobs/[id]/status` - Change job status
- `POST /api/admin/jobs/[id]/capture` - Force capture payment
- `POST /api/admin/jobs/[id]/refund` - Issue refund
- `POST /api/admin/jobs/[id]/force-complete` - Force complete job
- `POST /api/admin/jobs/[id]/reassign` - Reassign job
- `POST /api/admin/providers/[id]/toggle-active` - Toggle provider status
- `POST /api/admin/payments/[id]/retry` - Retry failed payment

## 🎨 UI Pages

### Homeowner
- `/` - Landing page
- `/auth/register` - Registration
- `/auth/login` - Login
- `/dashboard` - Homeowner dashboard
- `/problems/new` - Submit problem
- `/problems/[id]/chat` - AI chat
- `/problems/[id]/professionals` - Find professionals
- `/jobs/[id]` - Job details
- `/jobs/[id]/approve-repair` - Approve repair quote

### Provider
- `/provider/dashboard` - Provider dashboard
- `/provider/settings` - Settings (diagnostic fee)
- `/provider/jobs/[id]/repair-quote` - Submit repair quote

### Admin
- `/admin` - Admin operations dashboard

## 🔒 Security

- JWT authentication with refresh tokens
- Role-based access control (Homeowner, Provider, Admin)
- Stripe payment authorization before capture
- Input validation on all endpoints
- SQL injection protection via Prisma
- XSS protection via React

## 📈 Monitoring

- Vercel Analytics for performance
- Stripe Dashboard for payments
- Admin dashboard for operations
- Error logging in API routes

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

## 📄 License

Proprietary - All rights reserved

## 🚦 Roadmap

### Phase 1: MVP (Current)
- [x] Instant booking flow
- [x] Payment authorization and capture
- [x] Repair quote system
- [x] Admin operations tools

### Phase 2: Beta Launch
- [ ] Mobile responsive testing
- [ ] End-to-end testing
- [ ] Production deployment
- [ ] First 5-10 providers onboarded
- [ ] First 10-20 jobs completed

### Phase 3: Growth
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Provider ratings and reviews
- [ ] Scheduling system
- [ ] Multi-property management (for PMs)
- [ ] Recurring maintenance plans

### Phase 4: Scale
- [ ] Mobile apps (iOS/Android)
- [ ] Advanced analytics
- [ ] Automated provider matching
- [ ] Dynamic pricing
- [ ] Warranty tracking
- [ ] Integration with property management software

## 💡 Product Philosophy

- **Lean**: Ship core features first, add only what's requested
- **Disciplined**: One clean engine, no forking
- **Staged**: Test with real users before expanding
- **Focused**: Property managers first, homeowners as overflow
- **Operational**: Manual intervention tools for beta phase

## 📞 Support

For technical issues:
- Check documentation in this repo
- Review error logs in Vercel dashboard
- Check Stripe dashboard for payment issues
- Use admin dashboard for manual intervention

## 🎯 Success Metrics

- Booking completion rate
- Payment capture success rate
- Provider response time
- Homeowner satisfaction
- Platform fee revenue
- Provider retention

---

**Status**: Ready for testing and deployment
**Last Updated**: February 2026
**Version**: 1.0.0-beta
