# Find Jobs Feature - Provider Job Marketplace

## Overview
A dedicated page where providers can browse, filter, search, and claim available jobs in their area.

## Features Implemented

### 1. Dedicated "Find Jobs" Page
**Route:** `/provider/jobs/find`
**File:** `app/provider/jobs/find/page.tsx`

#### Layout:
```
┌─────────────────────────────────────────────────┐
│  Navigation: Dashboard | Find Jobs | Settings   │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  Find Jobs                                       │
│  Discover and claim jobs in your area           │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ Filters & Search                          │  │
│  │ [Category ▼] [Sort ▼] [Search...]        │  │
│  │ Showing X jobs                            │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ ❄️ HVAC • San Francisco • 2 hours ago    │  │
│  │ AC not cooling properly...                │  │
│  │ [View Details] [Claim Job]                │  │
│  └──────────────────────────────────────────┘  │
│  ... more jobs ...                              │
└─────────────────────────────────────────────────┘
```

### 2. Filtering & Sorting

#### Category Filter:
- All Categories
- HVAC
- Plumbing
- Electrical
- General Maintenance

#### Sort Options:
- Most Recent (default)
- Oldest First
- Distance (by zip code for now)

#### Search:
- Search by keywords in description
- Search by location (city, zip code)
- Search by category
- Real-time filtering as you type

### 3. Job Cards

Each job displays:
- **Category icon** (❄️ HVAC, 🔧 Plumbing, ⚡ Electrical, 🛠️ General)
- **Category name** with "Available" badge
- **Location** (city, state, zip)
- **Time posted** (e.g., "2 hours ago", "3 days ago")
- **Description** (truncated to 2 lines)
- **Actions:**
  - "View Details" - See full job information
  - "Claim Job" - Assign job to yourself

### 4. Empty States

**No jobs found:**
- Shows friendly message with search icon
- Suggests adjusting filters
- "Clear Filters" button if filters are active

**No available jobs:**
- Encourages checking back later
- Shows when no jobs match criteria

### 5. Dashboard Integration

#### Updated Provider Dashboard:
- **"Find Jobs" button** in header (prominent, blue)
- **"Find Jobs" link** in navigation
- **Available Jobs card** with "Browse all jobs →" link
- **Quick preview** showing first 3 available jobs
- **"View All Jobs"** button in Available Jobs section

## User Flow

### Discovery Flow:
1. Provider logs into dashboard
2. Sees "X Available Jobs" in stats
3. Clicks "Find Jobs" button or link
4. Lands on Find Jobs page with all available jobs

### Filtering Flow:
1. Provider selects category filter (e.g., "HVAC")
2. Jobs instantly filter to show only HVAC jobs
3. Provider sorts by "Most Recent"
4. Provider searches for "AC" in search box
5. Results update in real-time

### Claiming Flow:
1. Provider finds interesting job
2. Clicks "View Details" to see full description
3. Clicks "Claim Job"
4. Confirms in popup dialog
5. Job is assigned to provider
6. Job disappears from available list
7. Success message: "Job claimed successfully! Check your dashboard."
8. Job appears in provider's dashboard

## Technical Details

### API Endpoints Used:
- `GET /api/jobs/available` - Fetch unclaimed jobs
- `POST /api/jobs/[id]/claim` - Claim a job

### State Management:
- `jobs` - All available jobs from API
- `filteredJobs` - Jobs after applying filters/search/sort
- `categoryFilter` - Selected category
- `sortBy` - Selected sort option
- `searchQuery` - Search input value
- `claimingJob` - ID of job being claimed (for loading state)

### Real-time Filtering:
- Uses `useEffect` to watch filter changes
- Applies all filters client-side for instant results
- No API calls needed when changing filters

### Time Display:
- Shows relative time (e.g., "2 hours ago")
- Converts to days after 24 hours
- User-friendly format

## Future Enhancements

### Phase 2 (Distance Calculation):
- Calculate actual distance from provider location
- Sort by real distance (miles/km)
- Show distance on job cards
- Filter by radius (e.g., "Within 10 miles")

### Phase 3 (Advanced Filters):
- Date range filter (posted in last 24h, 7 days, etc.)
- Price range filter (diagnostic fee)
- Urgency filter (urgent vs. standard)
- Homeowner rating filter

### Phase 4 (Notifications):
- Email notifications for new jobs
- SMS notifications for urgent jobs
- Push notifications in browser
- "Save search" feature with alerts

### Phase 5 (Map View):
- Toggle between list and map view
- See jobs plotted on map
- Click markers to see job details
- Visual representation of service area

### Phase 6 (Job Recommendations):
- AI-powered job matching
- "Recommended for you" section
- Based on past jobs, ratings, specialties
- Smart notifications for best matches

## Testing

### Test Scenario 1: Browse Jobs
1. Login as provider
2. Click "Find Jobs" in navigation
3. Verify all available jobs are displayed
4. Verify job cards show correct information

### Test Scenario 2: Filter by Category
1. On Find Jobs page
2. Select "HVAC" from category dropdown
3. Verify only HVAC jobs are shown
4. Change to "Plumbing"
5. Verify only plumbing jobs are shown

### Test Scenario 3: Search
1. Type "AC" in search box
2. Verify only jobs mentioning "AC" are shown
3. Type a zip code
4. Verify only jobs in that zip are shown

### Test Scenario 4: Sort
1. Select "Oldest First"
2. Verify jobs are sorted by date (oldest at top)
3. Select "Most Recent"
4. Verify newest jobs are at top

### Test Scenario 5: Claim Job
1. Click "Claim Job" on a job card
2. Confirm in dialog
3. Verify success message
4. Verify job disappears from list
5. Go to dashboard
6. Verify job appears in "Scheduled Visits" or assigned jobs

### Test Scenario 6: Empty State
1. Select a category with no jobs
2. Verify empty state message
3. Click "Clear Filters"
4. Verify all jobs are shown again

## Design Decisions

### Why a Separate Page?
- Dedicated space for job discovery
- More room for filters and search
- Better UX than cramming into dashboard
- Allows for future enhancements (map view, etc.)

### Why Client-Side Filtering?
- Instant results (no API calls)
- Better UX (no loading states)
- Reduces server load
- Jobs list is typically small (<100 items)

### Why Show Preview on Dashboard?
- Quick access to new jobs
- Encourages providers to check regularly
- Drives traffic to Find Jobs page
- Shows value immediately

### Why Relative Time?
- More intuitive than absolute dates
- Shows urgency ("2 hours ago" vs. "Jan 15, 2024")
- Familiar pattern from social media
- Updates automatically

## Accessibility

- Keyboard navigation supported
- Screen reader friendly labels
- High contrast colors
- Focus indicators on interactive elements
- Semantic HTML structure

## Mobile Responsive

- Filters stack vertically on mobile
- Job cards adapt to small screens
- Touch-friendly button sizes
- Readable text on all devices
