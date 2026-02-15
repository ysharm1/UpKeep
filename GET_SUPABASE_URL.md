# Get Your Supabase Database URL

## Quick Steps:

1. Go to https://supabase.com/dashboard
2. Click on your project (or create a new one if you haven't)
3. Click **"Project Settings"** (gear icon in the left sidebar)
4. Click **"Database"** in the left menu
5. Scroll down to **"Connection string"**
6. Click the **"URI"** tab
7. Copy the connection string (looks like):
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
   ```
8. Replace `[YOUR-PASSWORD]` with your actual database password

## Once you have it:

Paste it here in the chat, and I'll add it to Vercel and complete the deployment!

Or if you prefer, you can add it manually:
```bash
vercel env add DATABASE_URL production
# Then paste your connection string when prompted
```
