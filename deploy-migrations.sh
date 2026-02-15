#!/bin/bash
export DATABASE_URL="postgresql://postgres.umtacdslewohvlfukzua:Yash0073416!@aws-0-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require"
npx prisma migrate deploy
