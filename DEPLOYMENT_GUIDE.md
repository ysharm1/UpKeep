# UpKeep Deployment Guide

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Stripe account (test mode for development)
- Database provider account (Railway, Supabase, or Neon)
- OpenAI API key

## Step 1: Set Up Production Database

### Option A: Railway (Recommended)
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Provision PostgreSQL"
4. Copy the `DATABASE_URL` from the Connect tab

### Option B: Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the Connection String (URI format)

### Option C: Neon
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string

## Step 2: Set Up Stripe

1. Go to [stripe.com/dashboard](https://dashboard.stripe.com)
2. Get your API keys from Developers → API keys
3. For production, use live keys (starts with `sk_live_` and `pk_live_`)
4. For testing, use test keys (starts with `sk_test_` and `pk_test_`)

## Step 3: Deploy to Vercel

### 3.1 Connect Repository
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Select the `UpKeep` repository

### 3.2 Configure Environment Variables
In the Vercel project settings, add these environment variables:

```
DATABASE_URL=your_database_url_from_step_1
JWT_SECRET=generate_random_string_here
JWT_REFRESH_SECRET=generate_different_random_string
STRIPE_SECRET_KEY=sk_test_or_sk_live_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_or_pk_live_your_key
OPENAI_API_KEY=sk-your-openai-key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Generate JWT secrets:**
```bash
# Run these commands to generate secure random strings
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.3 Deploy
1. Click "Deploy"
2. Wait for the build to complete
3. Vercel will provide you with a URL (e.g., `your-app.vercel.app`)

## Step 4: Run Database Migrations

After deployment, you need to run Prisma migrations on your production database:

### Option A: Using Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Run migrations
vercel env pull .env.production
npx prisma migrate deploy
```

### Option B: Using Local Terminal
```bash
# Set the production DATABASE_URL temporarily
export DATABASE_URL="your_production_database_url"

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Step 5: Seed Initial Data (Optional)

If you want to add test users or providers:

```bash
# With production DATABASE_URL set
npx prisma db seed
```

## Step 6: Test Production Deployment

1. Visit your Vercel URL
2. Register a test account
3. Test the complete flow:
   - Submit a problem
   - Book a diagnostic visit (use Stripe test card: `4242 4242 4242 4242`)
   - Verify payment is authorized in Stripe dashboard
   - Test admin dashboard at `/admin`

## Step 7: Configure Custom Domain (Optional)

1. In Vercel project settings, go to "Domains"
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` environment variable

## Step 8: Set Up Monitoring

### Vercel Analytics
1. Enable Vercel Analytics in project settings
2. Monitor performance and errors

### Stripe Webhooks (For Production)
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook secret and add to environment variables as `STRIPE_WEBHOOK_SECRET`

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify `package.json` has all dependencies

### Database Connection Fails
- Verify `DATABASE_URL` is correct
- Check if database allows connections from Vercel IPs
- For Supabase: Enable "Direct Connection" mode

### Prisma Errors
- Run `npx prisma generate` locally
- Commit the generated Prisma client
- Redeploy

### Stripe Errors
- Verify API keys are correct (test vs live)
- Check Stripe dashboard for error details
- Ensure webhook secret is set (if using webhooks)

## Production Checklist

Before going live:

- [ ] All environment variables set in Vercel
- [ ] Database migrations run successfully
- [ ] Stripe configured with live keys
- [ ] Test complete booking flow
- [ ] Test payment capture flow
- [ ] Test admin dashboard
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring enabled
- [ ] Error tracking set up
- [ ] Backup strategy for database
- [ ] SSL certificate active (automatic with Vercel)

## Rollback Strategy

If something goes wrong:

1. In Vercel dashboard, go to Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"
4. Your app will instantly rollback

## Scaling Considerations

As you grow:

1. **Database**: Upgrade to a larger plan on your database provider
2. **Vercel**: Free tier supports 100GB bandwidth/month
3. **Stripe**: No limits on test mode, production scales automatically
4. **Media Storage**: Consider adding AWS S3 for image uploads

## Support

- Vercel Docs: https://vercel.com/docs
- Prisma Docs: https://www.prisma.io/docs
- Stripe Docs: https://stripe.com/docs
- Next.js Docs: https://nextjs.org/docs

## Security Notes

- Never commit `.env` file to Git
- Rotate JWT secrets periodically
- Use Stripe live keys only in production
- Enable 2FA on all service accounts
- Monitor Stripe dashboard for suspicious activity
- Set up rate limiting for API endpoints (future enhancement)
