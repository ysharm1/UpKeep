# UpKeep Quick Start Guide

## Get Running in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your keys:
# - DATABASE_URL (get from Railway/Supabase)
# - JWT_SECRET (generate random string)
# - STRIPE_SECRET_KEY (get from Stripe dashboard)
# - OPENAI_API_KEY (get from OpenAI)
```

### 3. Set Up Database
```bash
# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed with test data (optional)
npx prisma db seed
```

### 4. Start Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## Test the Flow

### As Homeowner:
1. Register at `/auth/register` (role: Homeowner)
2. Submit a problem at `/problems/new`
3. Find professionals and book a visit
4. Use Stripe test card: `4242 4242 4242 4242`

### As Provider:
1. Register at `/auth/register` (role: Service Provider)
2. Set diagnostic fee at `/provider/settings`
3. View bookings at `/provider/dashboard`
4. Submit repair quotes
5. Complete jobs

### As Admin:
1. Update your user role to ADMIN in database
2. Access admin dashboard at `/admin`
3. Manage jobs, payments, and providers

## Key Files

- `prisma/schema.prisma` - Database schema
- `app/api/` - API endpoints
- `app/` - Frontend pages
- `lib/` - Business logic services

## Common Commands

```bash
# Run development server
npm run dev

# Run Prisma Studio (database GUI)
npx prisma studio

# Create new migration
npx prisma migrate dev --name your_migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Format code
npm run format

# Lint code
npm run lint
```

## Stripe Test Cards

- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- Insufficient Funds: `4000 0000 0000 9995`

## Next Steps

1. Read `TESTING_GUIDE.md` for complete testing instructions
2. Read `DEPLOYMENT_GUIDE.md` when ready to deploy
3. Read `EXECUTE.md` for launch strategy
4. Check `SHIP_IT.md` for product overview

## Troubleshooting

### "Can't connect to database"
- Check DATABASE_URL in .env
- Ensure database is running
- Run `npx prisma generate`

### "JWT error"
- Check JWT_SECRET is set in .env
- Clear localStorage in browser
- Re-login

### "Stripe error"
- Verify STRIPE_SECRET_KEY is correct
- Check you're using test mode keys (sk_test_...)
- Check Stripe dashboard for details

### "Module not found"
- Run `npm install`
- Delete node_modules and reinstall
- Check import paths

## Need Help?

- Check the error logs in terminal
- Use Prisma Studio to inspect database
- Check Stripe dashboard for payment issues
- Review API responses in browser DevTools

## Development Workflow

1. Make changes to code
2. Test locally
3. Run `npm run lint` to check for errors
4. Commit changes
5. Push to GitHub
6. Deploy to Vercel (automatic)

## Production Checklist

Before deploying:

- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Stripe configured
- [ ] Test complete flow locally
- [ ] No console errors
- [ ] Mobile responsive tested

See `DEPLOYMENT_GUIDE.md` for full deployment instructions.
