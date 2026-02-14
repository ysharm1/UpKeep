# UpKeep - Home Repair Marketplace Platform

A two-sided marketplace connecting homeowners with local service providers for HVAC, plumbing, electrical, and home maintenance services. Features AI-powered diagnostics, location-based matching, and secure payments.

## 🚀 Features

### For Homeowners
- 📸 Submit problems with photos and videos
- 🤖 AI-powered diagnostics with DIY solutions
- 🔍 Match with verified local professionals
- 💬 In-app messaging
- ⭐ Rate and review service providers
- 💳 Secure payment processing

### For Service Providers
- 📋 Professional profile with verification
- 📍 Define service area (radius or zip codes)
- 🔔 Receive qualified job requests
- 💼 Manage jobs and communicate with clients
- ⭐ Build reputation through ratings
- 💰 Fast, secure payments

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js 20, Express.js, Prisma ORM
- **Database**: PostgreSQL 15
- **AI**: OpenAI GPT-4 (with Vision API)
- **Storage**: AWS S3
- **Payments**: Stripe
- **Testing**: Jest, fast-check (property-based testing)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd UpKeep
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Secret for access tokens
   - `JWT_REFRESH_SECRET` - Secret for refresh tokens
   - `OPENAI_API_KEY` - OpenAI API key
   - `STRIPE_SECRET_KEY` - Stripe secret key
   - `AWS_ACCESS_KEY_ID` - AWS access key
   - `AWS_SECRET_ACCESS_KEY` - AWS secret key
   - `CLOUD_STORAGE_BUCKET` - S3 bucket name

4. **Set up database**
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Run migrations
   npm run prisma:migrate
   
   # Seed database (optional)
   npm run prisma:seed
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/reset-password/request` - Request password reset
- `POST /api/auth/reset-password/confirm` - Confirm password reset

### Jobs
- `POST /api/jobs` - Create job request
- `GET /api/jobs` - Get job history (with filters)
- `GET /api/jobs/[id]` - Get job details
- `PATCH /api/jobs/[id]` - Update job status

### Media
- `POST /api/media/upload` - Upload media file
- `GET /api/media/[id]` - Get media URL
- `DELETE /api/media/[id]` - Delete media file

## 🏗️ Project Structure

```
UpKeep/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Auth pages
│   ├── dashboard/         # Dashboard page
│   └── page.tsx           # Landing page
├── lib/                   # Business logic
│   ├── ai/               # AI chatbot service
│   ├── auth/             # Auth service & middleware
│   ├── jobs/             # Job management
│   ├── matching/         # Matching engine
│   ├── media/            # Media & storage
│   ├── messaging/        # Messaging service
│   ├── payments/         # Payment service
│   ├── providers/        # Provider profiles
│   └── ratings/          # Rating system
├── prisma/               # Database
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
├── __tests__/            # Tests
└── .kiro/specs/          # Spec documents
```

## 🔐 Security Features

- Password hashing with bcrypt (12 salt rounds)
- JWT access tokens (15 min expiry)
- JWT refresh tokens (7 day expiry)
- Secure file upload validation
- SQL injection protection (Prisma)
- XSS protection
- CORS configuration
- Rate limiting ready

## 🌍 Deployment

### Vercel (Recommended for Frontend)
```bash
npm run build
vercel deploy
```

### Docker
```bash
docker build -t upkeep .
docker run -p 3000:3000 upkeep
```

### Environment Variables for Production
Ensure all environment variables are set in your deployment platform:
- Database connection
- API keys (OpenAI, Stripe, AWS)
- JWT secrets
- App URL

## 📈 Roadmap

### Phase 1 (MVP) ✅
- User authentication
- Job management
- AI diagnostics
- Provider matching
- Messaging
- Ratings
- Payments

### Phase 2 (Post-Launch)
- Real-time messaging with Socket.io
- Email/SMS notifications
- Advanced search and filters
- Provider scheduling/calendar
- Mobile app (React Native)
- Admin dashboard
- Analytics

### Phase 3 (Scale)
- Multi-language support
- Multiple payment methods
- Background job processing
- Advanced AI features
- API for third-party integrations

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Stripe for payment processing
- AWS for cloud storage
- Vercel for hosting platform

## 📞 Support

For support, email support@upkeep.com or open an issue in the repository.

---

Built with ❤️ for homeowners and service providers
