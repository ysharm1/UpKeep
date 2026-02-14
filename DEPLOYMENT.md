# UpKeep Deployment Guide

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- OpenAI API key
- Stripe account
- AWS S3 bucket

## Quick Start (Local Development)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Set up database**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Production Deployment

### Option 1: Vercel + Managed PostgreSQL

**Best for**: Quick deployment, automatic scaling

1. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

2. **Set up database**
   - Use Vercel Postgres, Supabase, or Neon
   - Add DATABASE_URL to Vercel environment variables

3. **Configure environment variables in Vercel**
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-secret
   JWT_REFRESH_SECRET=your-refresh-secret
   OPENAI_API_KEY=sk-...
   STRIPE_SECRET_KEY=sk_live_...
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   CLOUD_STORAGE_BUCKET=your-bucket
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```

4. **Run migrations**
   ```bash
   # From Vercel CLI or in build command
   npx prisma migrate deploy
   ```

### Option 2: Docker + AWS/GCP

**Best for**: Full control, custom infrastructure

1. **Create Dockerfile** (already included)

2. **Build image**
   ```bash
   docker build -t upkeep:latest .
   ```

3. **Run container**
   ```bash
   docker run -p 3000:3000 \
     -e DATABASE_URL="postgresql://..." \
     -e JWT_SECRET="..." \
     -e OPENAI_API_KEY="..." \
     upkeep:latest
   ```

4. **Deploy to AWS ECS/GCP Cloud Run**
   - Push image to ECR/GCR
   - Create service with environment variables
   - Set up load balancer
   - Configure auto-scaling

### Option 3: Traditional VPS (DigitalOcean, Linode)

**Best for**: Cost-effective, simple setup

1. **Set up server**
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PostgreSQL
   sudo apt-get install postgresql postgresql-contrib
   ```

2. **Clone and build**
   ```bash
   git clone <your-repo>
   cd UpKeep
   npm install
   npm run build
   ```

3. **Set up PM2**
   ```bash
   npm install -g pm2
   pm2 start npm --name "upkeep" -- start
   pm2 save
   pm2 startup
   ```

4. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **Set up SSL with Let's Encrypt**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Database Setup

### PostgreSQL Configuration

1. **Create database**
   ```sql
   CREATE DATABASE upkeep;
   CREATE USER upkeep_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE upkeep TO upkeep_user;
   ```

2. **Connection string**
   ```
   DATABASE_URL="postgresql://upkeep_user:secure_password@localhost:5432/upkeep?schema=public"
   ```

3. **Run migrations**
   ```bash
   npx prisma migrate deploy
   ```

4. **Seed initial data** (optional)
   ```bash
   npm run prisma:seed
   ```

### Database Backups

```bash
# Backup
pg_dump upkeep > backup_$(date +%Y%m%d).sql

# Restore
psql upkeep < backup_20240101.sql
```

## External Services Setup

### OpenAI API

1. Sign up at https://platform.openai.com
2. Create API key
3. Add to environment: `OPENAI_API_KEY=sk-...`
4. Monitor usage at https://platform.openai.com/usage

### Stripe

1. Sign up at https://stripe.com
2. Get API keys from Dashboard
3. Add to environment:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
4. Set up webhook endpoint: `https://your-domain.com/api/webhooks/stripe`

### AWS S3

1. Create S3 bucket
2. Create IAM user with S3 permissions
3. Add to environment:
   ```
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=us-east-1
   CLOUD_STORAGE_BUCKET=your-bucket-name
   ```
4. Configure CORS on bucket:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["https://your-domain.com"],
       "ExposeHeaders": []
     }
   ]
   ```

## Environment Variables

### Required

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/upkeep"

# JWT
JWT_SECRET="your-secret-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-key-min-32-chars"

# OpenAI
OPENAI_API_KEY="sk-..."

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."

# AWS S3
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
CLOUD_STORAGE_BUCKET="your-bucket"

# App
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### Optional

```bash
# Stripe Webhook
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (for future notifications)
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASSWORD="..."

# Monitoring
SENTRY_DSN="https://..."
```

## Security Checklist

- [ ] Change all default secrets
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Set up CORS properly
- [ ] Configure rate limiting
- [ ] Enable database SSL
- [ ] Restrict S3 bucket access
- [ ] Set up firewall rules
- [ ] Enable database backups
- [ ] Set up monitoring/alerts
- [ ] Review Stripe webhook security
- [ ] Implement API rate limiting
- [ ] Set up logging

## Monitoring

### Health Check Endpoint

```bash
curl https://your-domain.com/api/health
```

### Database Monitoring

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check database size
SELECT pg_size_pretty(pg_database_size('upkeep'));
```

### Application Logs

```bash
# PM2 logs
pm2 logs upkeep

# Docker logs
docker logs upkeep-container

# Vercel logs
vercel logs
```

## Scaling

### Horizontal Scaling

1. **Load Balancer**: Use AWS ALB, GCP Load Balancer, or Nginx
2. **Multiple Instances**: Run multiple app instances
3. **Database**: Use read replicas for read-heavy operations
4. **Caching**: Add Redis for session storage and caching

### Vertical Scaling

1. **Increase server resources**: CPU, RAM
2. **Database optimization**: Indexes, query optimization
3. **CDN**: Use CloudFront or Cloudflare for static assets

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL

# Check if database is running
sudo systemctl status postgresql
```

### Build Failures

```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### API Errors

```bash
# Check logs
pm2 logs upkeep --lines 100

# Check environment variables
printenv | grep -E 'DATABASE|JWT|OPENAI|STRIPE|AWS'
```

## Maintenance

### Regular Tasks

- **Daily**: Monitor error logs
- **Weekly**: Check database performance
- **Monthly**: Review API usage and costs
- **Quarterly**: Update dependencies
- **Yearly**: Rotate secrets and API keys

### Updates

```bash
# Update dependencies
npm update

# Update Prisma
npm install @prisma/client@latest prisma@latest
npx prisma generate

# Run new migrations
npx prisma migrate deploy
```

## Support

For deployment issues:
1. Check logs first
2. Review environment variables
3. Test database connection
4. Verify external service credentials
5. Open GitHub issue if needed

---

**Production Checklist**: Before going live, ensure all items in Security Checklist are complete!
