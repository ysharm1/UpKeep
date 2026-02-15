# UX Improvements - Address Auto-Fill

## Problem Solved
Users were being asked to enter their address every time they created a new problem, which was repetitive and annoying.

## Solution Implemented

### 1. Registration Flow Enhancement
**File: `app/auth/register/page.tsx`**
- Added address fields (street, city, state, zip) to homeowner registration
- Address is now collected once during signup
- Only shown for homeowners (not service providers)

### 2. Backend Updates
**Files: `app/api/auth/register/route.ts`, `lib/auth/auth.service.ts`**
- Updated registration API to accept and save address
- Address is stored in the `Address` table and linked to `HomeownerProfile`
- Uses default coordinates (37.7749, -122.4194) - will be geocoded in production

### 3. Profile API
**File: `app/api/profile/route.ts`** (NEW)
- Created new endpoint to fetch user profile with address
- Returns homeowner profile including linked address
- Used by problem creation page to auto-populate location

### 4. Problem Creation Auto-Fill
**File: `app/problems/new/page.tsx`**
- Added `useEffect` hook to fetch user profile on page load
- Auto-populates location fields with saved address
- Shows "(Pre-filled from your profile)" indicator when address is loaded
- Users can still edit the address if needed (e.g., for a different property)

## User Experience Flow

### Before:
1. User registers → enters basic info
2. User creates problem → enters address again
3. User creates another problem → enters address AGAIN
4. Repeat for every problem...

### After:
1. User registers → enters basic info + home address (one time)
2. User creates problem → address already filled in ✨
3. User creates another problem → address already filled in ✨
4. User can edit if needed (e.g., rental property)

## Other Redundancies Checked

✅ **Phone Number** - Already collected at signup, not asked again
✅ **Name** - Already collected at signup, not asked again
✅ **Email** - Already collected at signup, not asked again

## Testing Notes

When testing:
1. Register a new homeowner account - you'll now see address fields
2. Create a problem - location should auto-populate
3. The address can still be edited if needed

## Future Enhancements

- Allow users to save multiple addresses (e.g., primary home, rental properties)
- Add address autocomplete using Google Places API
- Geocode addresses to get accurate lat/long coordinates
- Add "Use different address" option with saved addresses dropdown
