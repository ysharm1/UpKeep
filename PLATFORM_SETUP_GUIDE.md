# Platform Setup Guide - Production Deployment

## ✅ What's Been Completed

### 1. Code Cleanup
- ✅ Removed all deprecated "accept" code
- ✅ Simplified to single payment model (shared leads)
- ✅ Updated SMS notifications
- ✅ Cleaned up Partner interface

### 2. Production URLs
- ✅ Created `lib/config.ts` with `getAppUrl()` helper
- ✅ SMS links now work in production (Vercel URL support)
- ✅ Automatic fallback to localhost in development

### 3. Phone Verification
- ✅ Added `phoneVerified` field to User model
- ✅ Created phone verification service (Twilio Verify API)
- ✅ Built PhoneVerificationModal component
- ✅ Integrated into problem submission flow
- ✅ Development mode: use code "123456" for testing

### 4. Geographic Filtering
- ✅ Added lat/lng fields to JobRequest and ServiceProviderProfile
- ✅ Created geocoding service (OpenCage API)
- ✅ Implemented distance calculation (Haversine formula)
- ✅ Filter vendors by service radius
- ✅ Only notify vendors within their service area

---

## 🚀 Production Deployment Checklist

### Step 1: Environment Variables (Vercel Dashboard)

Go to your Vercel project → Settings → Environment Variables and add:

```bash
# Required - Production URL
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Required - Twilio (SMS Notifications)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Required - Twilio Verify (Phone Verification)
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxx

# Optional but Recommended - OpenCage (Geographic Filtering)
OPENCAGE_API_KEY=your_opencage_api_key

# Already configured (keep these)
DATABASE_URL=your_postgres_url
STRIPE_SECRET_KEY=sk_live_xxxxx
OPENAI_API_KEY=sk-xxxxx
```

### Step 2: Get API Keys

#### Twilio Verify Service (Phone Verification)
1. Go to https://console.twilio.com/us1/develop/verify/services
2. Click "Create new Service"
3. Name it "UpKeep Phone Verification"
4. Copy the Service SID (starts with VA...)
5. Add to Vercel: `TWILIO_VERIFY_SERVICE_SID`

#### OpenCage Geocoding (Geographic Filtering)
1. Go to https://opencagedata.com/api
2. Sign up for free account (2,500 requests/day)
3. Get your API key
4. Add to Vercel: `OPENCAGE_API_KEY`

**Note:** If you skip OpenCage, geographic filtering won't work and ALL vendors will be notified (not ideal but functional).

### Step 3: Database Migration

Run this command to update your production database:

```bash
# Option A: Using Prisma Migrate (recommended)
npx prisma migrate deploy

# Option B: Using Prisma DB Push (if migrations are messy)
npx prisma db push
```

This adds:
- `User.phoneVerified` (boolean)
- `JobRequest.latitude`, `JobRequest.longitude` (float)
- `ServiceProviderProfile.serviceRadius`, `latitude`, `longitude` (float)

### Step 4: Update Partner Coordinates

Your partners in `lib/partners.ts` need coordinates for geographic filtering to work.

**Option A: Add coordinates manually**
```typescript
{
  id: 'partner-1',
  name: 'ABC HVAC Services',
  serviceArea: {
    city: 'Phoenix',
    state: 'AZ',
    radius: 25,
    latitude: 33.4484,  // Add this
    longitude: -112.0740, // Add this
  },
}
```

**Option B: Use geocoding to get coordinates**
1. Go to https://www.latlong.net/
2. Enter partner's city/address
3. Copy lat/lng to partner config

### Step 5: Test in Production

1. **Test Phone Verification**
   - Register as homeowner
   - Try to submit problem
   - Should see verification modal
   - Enter code from SMS
   - Should allow submission

2. **Test Geographic Filtering**
   - Submit problem from different locations
   - Check server logs to see which vendors were notified
   - Verify only nearby vendors receive SMS

3. **Test SMS Links**
   - Check SMS messages
   - Click the lead URL
   - Should go to production domain (not localhost)

---

## 🧪 Development Testing

### Phone Verification (Development Mode)
When Twilio is not configured, the system uses a development mode:
- Any verification code request succeeds
- Use code `123456` to verify
- No actual SMS sent

### Geographic Filtering (Without OpenCage)
When OpenCage is not configured:
- Geocoding is skipped
- All vendors in category are notified (fallback behavior)
- Warning logged to console

---

## 📊 Monitoring & Debugging

### Check Logs (Vercel)
```bash
vercel logs --follow
```

Look for:
- `📢 Broadcasting lead to X nearby partners via SMS`
- `✅ SMS sent to partner: [name]`
- `⚠️ No partners found within service area`
- `✅ Phone verified: [phone]`

### Common Issues

**Issue: SMS links go to localhost**
- Solution: Set `NEXT_PUBLIC_APP_URL` in Vercel

**Issue: No vendors notified**
- Check: Partners have coordinates in `lib/partners.ts`
- Check: `OPENCAGE_API_KEY` is set
- Check: Service radius is large enough (default 25 miles)

**Issue: Phone verification not working**
- Check: `TWILIO_VERIFY_SERVICE_SID` is set
- Check: Phone number is in E.164 format (+1234567890)
- Development: Use code "123456"

**Issue: All vendors notified (not filtered by distance)**
- Check: OpenCage API key is configured
- Check: Partners have lat/lng coordinates
- Check: Job was geocoded successfully (check logs)

---

## 🎯 Next Steps (Post-Launch)

### Week 1: Get Real Vendors
1. Call 20 local HVAC/plumbing companies
2. Offer first 10 leads FREE
3. Get 5 vendors to sign up
4. Add their info to `lib/partners.ts` with coordinates

### Week 2: Test with Real Leads
1. Post on local Facebook groups
2. Get 10 real homeowner submissions
3. Verify vendors receive SMS
4. Track which vendors purchase leads

### Week 3: Optimize
1. Adjust service radius based on vendor feedback
2. Fine-tune pricing if needed
3. Add more vendors in different categories
4. Monitor lead quality

---

## 🔧 Configuration Files

### lib/partners.ts
```typescript
export const PARTNERS: Partner[] = [
  {
    id: 'partner-1',
    name: 'ABC HVAC Services',
    email: 'leads@abchvac.com',
    phone: '+14805550100', // E.164 format
    categories: ['hvac'],
    serviceArea: {
      city: 'Phoenix',
      state: 'AZ',
      radius: 25, // miles
      latitude: 33.4484,
      longitude: -112.0740,
    },
    active: true,
  },
]
```

### .env (Production)
```bash
NEXT_PUBLIC_APP_URL=https://upkeep.yourdomain.com
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxx
OPENCAGE_API_KEY=your_api_key
```

---

## 📞 Support

If you encounter issues:
1. Check Vercel logs
2. Verify environment variables are set
3. Test in development mode first
4. Check database migration status

---

## ✨ Summary

You now have:
- ✅ Clean codebase (no deprecated code)
- ✅ Production-ready SMS links
- ✅ Phone verification (reduces spam)
- ✅ Geographic filtering (better vendor experience)
- ✅ Shared lead model ($40-80 per lead)
- ✅ Property-based pricing

**Ready to launch!** 🚀

Next: Get real vendors and test with real leads.
