# Provider Dashboard - Available Jobs Feature

## Problem Solved
Providers could only see jobs already assigned to them. They had no way to discover and claim new jobs in their area.

## Solution Implemented

### 1. Available Jobs Section (NEW)
**File: `app/provider/dashboard/page.tsx`**
- Added new "Available Jobs Near You" section at the top of the dashboard
- Shows jobs that are:
  - Not yet claimed by any provider
  - Match the provider's specialties
  - In "submitted" or "pending_match" status
- Displays job details: category, description, location, posted date
- "Claim Job" button to assign the job to the provider
- "View Details" link to see full job information

### 2. Available Jobs API
**File: `app/api/jobs/available/route.ts`** (NEW)
- GET endpoint that returns unclaimed jobs
- Filters by:
  - Provider's specialties (HVAC, plumbing, electrical, etc.)
  - Job status (submitted, pending_match)
  - Not yet assigned to any provider
- Returns up to 20 most recent jobs
- Ordered by creation date (newest first)

### 3. Claim Job API
**File: `app/api/jobs/[id]/claim/route.ts`** (NEW)
- POST endpoint to claim a job
- Validates:
  - Provider has set diagnostic fee (required before claiming)
  - Job is still available (not claimed by someone else)
  - Job category matches provider's specialties
- Updates job status to "matched"
- Assigns provider to the job

### 4. Dashboard Stats Update
- Changed from 2-column to 3-column layout
- Added "Available Jobs" stat card showing count of claimable jobs
- Existing "Scheduled Visits" and "Active Jobs" cards remain

## User Flow

### Before:
1. Provider logs in → sees empty dashboard
2. No way to find new work
3. Must wait for homeowners to book them directly

### After:
1. Provider logs in → sees available jobs in their area
2. Reviews job details (category, description, location)
3. Clicks "Claim Job" → job is assigned to them
4. Job moves to "Scheduled Visits" section (after homeowner books)
5. Provider can contact homeowner to schedule diagnostic visit

## Business Logic

### Job Claiming Rules:
- ✅ Provider must have diagnostic fee set
- ✅ Job must match provider's specialties
- ✅ Job must not be claimed by another provider
- ✅ Job must be in "submitted" or "pending_match" status
- ✅ After claiming, job status changes to "matched"

### What Happens After Claiming:
1. Job is assigned to the provider
2. Status changes from "submitted" → "matched"
3. Homeowner can now book a diagnostic visit with this provider
4. Job appears in provider's "Scheduled Visits" after booking

## Testing

To test the new feature:

1. **As Homeowner:**
   - Create a new problem (don't book a provider yet)
   - This creates a job in "submitted" status

2. **As Provider:**
   - Set your diagnostic fee in Settings (if not already set)
   - Set your specialties to match the job category
   - Go to dashboard → see the job in "Available Jobs"
   - Click "Claim Job"
   - Job should disappear from available and move to your assigned jobs

3. **As Homeowner (again):**
   - Go to the problem → "Find Professionals"
   - You should now see the provider who claimed the job
   - Book a diagnostic visit

4. **As Provider (again):**
   - Refresh dashboard
   - Job should now appear in "Scheduled Visits" section

## Future Enhancements

- Add distance calculation (show "X miles away")
- Add location-based filtering (only show jobs within service radius)
- Add job notifications (email/SMS when new jobs available)
- Add job search and filters (by category, location, date)
- Add "Decline Job" option after claiming
- Add automatic matching algorithm (suggest best providers to homeowners)
