#!/usr/bin/env node

/**
 * Generate secure secrets for production
 * Run: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 SECURE SECRETS GENERATOR\n');
console.log('Copy these values to your Vercel environment variables:\n');
console.log('─'.repeat(80));

// Generate JWT secrets
const jwtSecret = crypto.randomBytes(64).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');

console.log('\n1️⃣  JWT_SECRET:');
console.log(jwtSecret);

console.log('\n2️⃣  JWT_REFRESH_SECRET:');
console.log(jwtRefreshSecret);

console.log('\n─'.repeat(80));
console.log('\n📝 NEXT STEPS:\n');
console.log('1. Update these in Vercel:');
console.log('   vercel env rm JWT_SECRET production');
console.log('   vercel env add JWT_SECRET production');
console.log('   (paste the JWT_SECRET value above)\n');
console.log('   vercel env rm JWT_REFRESH_SECRET production');
console.log('   vercel env add JWT_REFRESH_SECRET production');
console.log('   (paste the JWT_REFRESH_SECRET value above)\n');

console.log('2. Rotate your database password in Supabase dashboard:');
console.log('   https://supabase.com/dashboard/project/umtacdslewohvlfukzua/settings/database\n');

console.log('3. Rotate your OpenAI API key:');
console.log('   https://platform.openai.com/api-keys\n');

console.log('4. Get Stripe LIVE keys (not test):');
console.log('   https://dashboard.stripe.com/apikeys\n');

console.log('5. Update NEXT_PUBLIC_APP_URL:');
console.log('   vercel env rm NEXT_PUBLIC_APP_URL production');
console.log('   vercel env add NEXT_PUBLIC_APP_URL production');
console.log('   (enter: https://up-keep-9zbu.vercel.app)\n');

console.log('6. Redeploy:');
console.log('   vercel --prod\n');

console.log('─'.repeat(80));
console.log('\n✅ After completing these steps, your app will be secure!\n');
