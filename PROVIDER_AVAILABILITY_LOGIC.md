# Provider Availability Logic

## Overview

This document explains how we handle provider availability and matching in the UpKeep platform.

## The Problem

When a homeowner requests a diagnostic visit, how do we show them which providers are available?

## Our Approach (MVP)

We use a **smart sorting algorithm** rather than strict "available/unavailable" filtering.

### Why Not "Only Show Available Now"?

1. **Empty results problem** - If no one is free, homeowner sees nothing
2. **Provider flexibility** - Providers manage their own schedules
3. **Complexity** - Would need real-time calendar integration
4. **False expectations** - "Available" doesn't mean "can come in 5 minutes"

### What We Do Instead

**Show all qualified providers, sorted by likelihood of quick response:**

## Filtering Criteria

Providers must meet ALL of these to appear:

1. ✅ **Has matching specialty** (HVAC, plumbing, electrical, etc.)
2. ✅ **Verified** - Background check and license verified
3. ✅ **Active** - `isActive = true` (not suspended/deactivated)
4. ✅ **Has diagnostic fee set** - Ready to accept bookings
5. ✅ **In service area** - Within their radius or zip codes

## Sorting Algorithm

Providers are sorted by:

### 1. Availability (Primary)
- **Available** = Less than 3 active jobs
- **Busy** = 3 or more active jobs
- Available providers always appear first

### 2. Distance (Secondary)
- Closer providers ranked higher
- Only matters if distance difference > 5 miles
- Uses Haversine formula for accurate calculation

### 3. Rating (Tertiary)
- Higher rated providers ranked higher
- Only used as tiebreaker

## Workload Indicators

We show homeowners estimated response times based on current workload:

| Active Jobs | Status | Estimated Response |
|-------------|--------|-------------------|
| 0 jobs | 🟢 Available | ~2 hours |
| 1 job | 🟢 Available | ~4 hours |
| 2 jobs | 🟢 Available | ~8 hours |
| 3+ jobs | 🟡 Busy | ~24 hours |

## UI Display

### Available Provider
```
Quick Fix HVAC                    [Available]
★★★★☆ 4.8 (42 reviews)           [Verified]
📍 2.3 miles away  🕒 Responds in ~4hrs

Diagnostic Visit: $89
[Book Diagnostic Visit - $89]
```

### Busy Provider
```
Cool Air Services
★★★★★ 4.9 (38 reviews)           [Verified]
📍 3.7 miles away  🕒 Responds in ~24hrs
⚠️ Currently busy with 4 jobs

Diagnostic Visit: $75
[Book Diagnostic Visit - $75]
```

## What Happens After Booking

1. **Homeowner books** - Payment authorized (not captured)
2. **Provider gets notification** - Via dashboard/email/SMS
3. **Provider accepts** - Proposes time slot
4. **Or provider declines** - If too busy, we notify homeowner
5. **Admin can reassign** - Using admin dashboard if needed

## Future Enhancements (Post-MVP)

### Phase 2: Calendar Integration
- Providers set available time slots
- Homeowners see "Next available: Tomorrow 2pm"
- Instant scheduling confirmation

### Phase 3: Smart Matching
- AI predicts best provider based on:
  - Historical response times
  - Job completion rates
  - Specialty match quality
  - Customer preferences

### Phase 4: Dynamic Pricing
- Surge pricing during high demand
- Discounts for off-peak times
- Premium for same-day service

## Why This Works

1. **Always shows results** - Homeowners never see empty list
2. **Transparent expectations** - Shows estimated response time
3. **Provider flexibility** - They can accept/decline based on schedule
4. **Simple to implement** - No complex calendar system needed
5. **Scales well** - Works with 5 providers or 500

## Comparison to Other Platforms

### Uber/Lyft
- Shows all nearby drivers
- Estimates arrival time
- Driver accepts/declines

### TaskRabbit
- Shows all taskers
- Shows "Typically responds in X hours"
- Tasker proposes time

### Thumbtack
- Shows all pros
- Pros send quotes
- Customer chooses

**We're closest to Uber** - instant booking with smart matching.

## Edge Cases

### No Providers Available
- Show message: "No providers in your area yet"
- Collect email for notification when available
- Suggest expanding search radius

### All Providers Busy
- Still show them with "Busy" indicator
- Let homeowner book anyway
- Provider can accept for later date

### Provider Doesn't Respond
- Admin gets alert after 4 hours
- Admin can reassign to another provider
- Homeowner gets notification

## Metrics to Track

1. **Response time** - How long until provider accepts
2. **Acceptance rate** - % of bookings accepted
3. **Completion rate** - % of accepted jobs completed
4. **Cancellation rate** - % of jobs cancelled
5. **Reliability score** - Composite of above

These feed back into the sorting algorithm over time.

## Code Location

- **API**: `app/api/providers/nearby/route.ts`
- **UI**: `app/problems/[id]/professionals/page.tsx`
- **Database**: `ServiceProviderProfile.activeJobsCount` (calculated)

## Testing

To test availability logic:

1. Create multiple providers
2. Assign jobs to some providers
3. Search for providers
4. Verify sorting: Available first, then by distance, then by rating

```bash
# Add test jobs to a provider
psql -U user -d upkeep
UPDATE "JobRequest" SET "assignedProviderId" = 'provider-id' WHERE id = 'job-id';
```

## Summary

**We show all qualified providers, sorted intelligently, with clear availability indicators.**

This gives homeowners choice while setting realistic expectations, and gives providers flexibility to manage their own schedules.
